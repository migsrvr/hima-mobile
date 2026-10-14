/**
 * Checkout evaluation (12a–12c). Previews a payment against the week's plan:
 * the category plan covers first, then Safe-to-Spend, then the emergency reserve
 * (then savings), and nothing can ever exceed the real wallet balance.
 */
import { categoryLeft, summarizeWeek, type WeekSummary } from '@/services/budget/week';
import { toCents, toPesos } from '@/services/budget/safeToSpend';
import type { BudgetCategory, Transaction } from '@/types/finance';
import type { ConfirmedPlan } from '@/types/plan';

export type CheckoutState = 'withinBudget' | 'overSafeToSpend' | 'blocked';

export type CheckoutEvaluation = {
  state: CheckoutState;
  amount: number;
  category: BudgetCategory;
  before: WeekSummary;
  /** Undefined when the payment is blocked (it can't happen). */
  after?: WeekSummary;
  /** Paid from the category's plan (today's food plan, the week's school plan…). */
  fromPlan: number;
  fromSafeToSpend: number;
  fromReserve: number;
  /** Only when the emergency reserve isn't enough. */
  fromSavings: number;
  planLeftBefore: number;
  planLeftAfter: number;
  reserveBefore: number;
  reserveAfter: number;
  /** blocked: how much the wallet is short. */
  shortBy: number;
  /** Largest amount that fits right now without touching reserves (plan left + Safe-to-Spend). */
  fitsWithoutReserve: number;
};

type Input = {
  plan: ConfirmedPlan;
  transactions: Transaction[];
  walletBalance: number;
  now: Date;
  amount: number;
  category: BudgetCategory;
};

export function evaluateCheckout({ plan, transactions, walletBalance, now, amount, category }: Input): CheckoutEvaluation {
  const before = summarizeWeek({ plan, transactions, walletBalance, now });
  const planLeftBefore = categoryLeft(before, category);
  const emergency = toCents(before.emergency);
  const reserveOf = (shortfall: number) => toPesos(Math.max(0, emergency - toCents(shortfall)));
  const fitsWithoutReserve = toPesos(toCents(planLeftBefore) + toCents(before.safeToSpend));
  const common = { amount, category, before, planLeftBefore, reserveBefore: reserveOf(before.shortfall), fitsWithoutReserve };

  if (toCents(amount) > toCents(walletBalance)) {
    return {
      ...common,
      state: 'blocked',
      fromPlan: 0,
      fromSafeToSpend: 0,
      fromReserve: 0,
      fromSavings: 0,
      planLeftAfter: planLeftBefore,
      reserveAfter: reserveOf(before.shortfall),
      shortBy: toPesos(toCents(amount) - toCents(walletBalance)),
    };
  }

  const preview: Transaction = {
    id: 'checkout-preview',
    merchantName: '',
    category,
    amount,
    direction: 'out',
    status: 'pending',
    createdAt: now.toISOString(),
  };
  const after = summarizeWeek({
    plan,
    transactions: [...transactions, preview],
    walletBalance: toPesos(toCents(walletBalance) - toCents(amount)),
    now,
  });
  const planLeftAfter = categoryLeft(after, category);
  const newShortfall = toCents(after.shortfall) - toCents(before.shortfall);
  const savingsUsedBefore = Math.max(0, toCents(before.shortfall) - emergency);
  const savingsUsedAfter = Math.max(0, toCents(after.shortfall) - emergency);
  const fromSavings = savingsUsedAfter - savingsUsedBefore;

  return {
    ...common,
    state: newShortfall > 0 ? 'overSafeToSpend' : 'withinBudget',
    after,
    fromPlan: toPesos(toCents(planLeftBefore) - toCents(planLeftAfter)),
    fromSafeToSpend: toPesos(toCents(before.safeToSpend) - toCents(after.safeToSpend)),
    fromReserve: toPesos(newShortfall - fromSavings),
    fromSavings: toPesos(fromSavings),
    planLeftAfter,
    reserveAfter: reserveOf(after.shortfall),
    shortBy: 0,
  };
}
