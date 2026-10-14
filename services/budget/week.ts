/**
 * Week accounting behind Home, Schedule, Insights, Checkout and Hima AI.
 * Deterministic and UI-free; all math in whole centavos.
 *
 * How plans are "used up" (README sample: Wednesday morning, ₱920 Safe-to-Spend):
 * - A finished day uses its whole plan. Money left under plan on that day moves
 *   into Safe-to-Spend; overspending comes out of it.
 * - Today uses only what has been spent in each planned category so far.
 * - Weekly lines (school) use what has been spent this week, up to the line.
 * - Future days use nothing yet.
 * Remaining planned = weekly plan − used up.
 * Safe-to-Spend = wallet balance − remaining planned − protected reserves.
 */
import type { BudgetCategory, Transaction } from '@/types/finance';
import type { ConfirmedPlan } from '@/types/plan';
import { orderedWeek, type ClassHours, type Weekday } from '@/types/schedule';
import { startOfDay } from '@/utils/date';

import { buildWeeklyPlan, weeklyAllowance } from './plan';
import { computeSafeToSpend, toCents, toPesos } from './safeToSpend';

/** Categories planned per day (food and transport on school days, other on free days). */
export type DailyCategory = 'food' | 'transport' | 'other';
const DAILY: readonly DailyCategory[] = ['food', 'transport', 'other'];

export type DayKind = 'school' | 'free';
export type DayTiming = 'past' | 'today' | 'future';

export type DaySummary = {
  date: Date;
  weekday: Weekday;
  kind: DayKind;
  timing: DayTiming;
  classHours?: ClassHours;
  /** This day's plan per daily category, in pesos (0 when not planned that day). */
  plan: Record<DailyCategory, number>;
  planTotal: number;
  /** Everything charged that day, by category (pending counts, failed doesn't). */
  spent: Record<BudgetCategory, number>;
  /** Spending in the categories this day planned for (what "₱225 of ₱230" compares). */
  spentPlanned: number;
  /** planTotal − spentPlanned (negative when over plan). */
  underPlan: number;
  charges: Transaction[];
};

export type WeekSummary = {
  start: Date;
  /** Last day of the week (inclusive). */
  end: Date;
  days: DaySummary[];
  today: DaySummary;
  /** Weekly plan per category, in pesos. */
  lines: Record<BudgetCategory, number>;
  plannedTotal: number;
  spentByCategory: Record<BudgetCategory, number>;
  spentTotal: number;
  usedUp: number;
  remainingPlanned: number;
  savings: number;
  emergency: number;
  protected: number;
  walletBalance: number;
  safeToSpend: number;
  /** How far the wallet falls short of the plan plus reserves (eats into the reserve). */
  shortfall: number;
  /** Sum over finished days of plan − spending (negative = over plan). */
  underPlan: number;
  status: 'onTrack' | 'overPlan';
  /** Days left in the week, today included. */
  daysLeft: number;
  /** Safe-to-Spend per remaining day, whole pesos ("about ₱184/day"). */
  perDay: number;
};

const ZERO_CATEGORIES = (): Record<BudgetCategory, number> => ({ food: 0, transport: 0, school: 0, other: 0 });

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** First day of the week containing `now`. */
export function startOfWeek(now: Date, weekStartsOn: Weekday): Date {
  const d = startOfDay(now);
  return addDays(d, -((d.getDay() - weekStartsOn + 7) % 7));
}

/** Weekly plan lines in centavos, including approved adjustments. */
export function planLinesCents(plan: ConfirmedPlan): Record<BudgetCategory, number> {
  const weekly = buildWeeklyPlan(plan.inputs);
  const adj = plan.adjustments ?? {};
  const line = (base: number, c: BudgetCategory) => Math.max(0, toCents(base) + toCents(adj[c] ?? 0));
  return {
    food: line(weekly.food, 'food'),
    transport: line(weekly.transport, 'transport'),
    school: line(weekly.school, 'school'),
    other: line(weekly.freeDaySpending, 'other'),
  };
}

/** Splits a weekly line across days, giving any leftover centavo to the earliest days. */
function spread(totalCents: number, days: Weekday[]): Map<Weekday, number> {
  const out = new Map<Weekday, number>();
  if (days.length === 0) return out;
  const base = Math.floor(totalCents / days.length);
  let rest = totalCents - base * days.length;
  for (const d of days) {
    out.set(d, base + (rest > 0 ? 1 : 0));
    rest -= 1;
  }
  return out;
}

const isCharge = (t: Transaction) => t.direction === 'out' && t.status !== 'failed';

export function summarizeWeek(input: {
  plan: ConfirmedPlan;
  transactions: Transaction[];
  walletBalance: number;
  now: Date;
  /** Show another week (Schedule navigation). Past/today/future still follow `now`. */
  weekOf?: Date;
}): WeekSummary {
  const { plan, transactions, walletBalance, now } = input;
  const start = startOfWeek(input.weekOf ?? now, plan.weekStartsOn);
  const endExclusive = addDays(start, 7);
  const today = startOfDay(now);
  const order = orderedWeek(plan.weekStartsOn);
  const school = new Set(plan.schoolDays);
  const lines = planLinesCents(plan);

  const schoolDays = order.filter((d) => school.has(d));
  const freeDays = order.filter((d) => !school.has(d));
  const shares: Record<DailyCategory, Map<Weekday, number>> = {
    food: spread(lines.food, schoolDays),
    transport: spread(lines.transport, schoolDays),
    other: spread(lines.other, freeDays),
  };

  const charges = transactions.filter((t) => {
    if (!isCharge(t)) return false;
    const at = new Date(t.createdAt);
    return at >= start && at < endExclusive;
  });

  const spentWeek = ZERO_CATEGORIES();
  for (const t of charges) spentWeek[t.category] += toCents(t.amount);

  let usedUp = 0;
  let underPlanCents = 0;
  const days: DaySummary[] = order.map((weekday, i) => {
    const date = addDays(start, i);
    const timing: DayTiming = date < today ? 'past' : isSameDay(date, today) ? 'today' : 'future';
    const dayCharges = charges.filter((t) => isSameDay(new Date(t.createdAt), date));
    const spent = ZERO_CATEGORIES();
    for (const t of dayCharges) spent[t.category] += toCents(t.amount);

    const planCents: Record<DailyCategory, number> = {
      food: shares.food.get(weekday) ?? 0,
      transport: shares.transport.get(weekday) ?? 0,
      other: shares.other.get(weekday) ?? 0,
    };
    const planTotal = planCents.food + planCents.transport + planCents.other;
    const spentPlanned = DAILY.reduce((sum, c) => sum + (planCents[c] > 0 ? spent[c] : 0), 0);

    if (timing === 'past') {
      usedUp += planTotal;
      underPlanCents += planTotal - spentPlanned;
    } else if (timing === 'today') {
      usedUp += DAILY.reduce((sum, c) => sum + Math.min(spent[c], planCents[c]), 0);
    }

    return {
      date,
      weekday,
      kind: school.has(weekday) ? 'school' : 'free',
      timing,
      classHours: plan.classHours[weekday],
      plan: { food: toPesos(planCents.food), transport: toPesos(planCents.transport), other: toPesos(planCents.other) },
      planTotal: toPesos(planTotal),
      spent: {
        food: toPesos(spent.food),
        transport: toPesos(spent.transport),
        school: toPesos(spent.school),
        other: toPesos(spent.other),
      },
      spentPlanned: toPesos(spentPlanned),
      underPlan: toPesos(planTotal - spentPlanned),
      charges: dayCharges,
    };
  });

  usedUp += Math.min(spentWeek.school, lines.school);

  const plannedTotal = lines.food + lines.transport + lines.school + lines.other;
  const remaining = plannedTotal - usedUp;
  const savings = toCents(plan.inputs.savingsPerWeek);
  const emergency = toCents(plan.inputs.emergencyPerWeek);
  const { safeToSpend, shortfall } = computeSafeToSpend({
    walletBalance,
    remainingPlanned: toPesos(remaining),
    protectedReserves: toPesos(savings + emergency),
  });
  const daysLeft = days.filter((d) => d.timing !== 'past').length;
  const spentTotal = spentWeek.food + spentWeek.transport + spentWeek.school + spentWeek.other;

  return {
    start,
    end: addDays(start, 6),
    days,
    today: days.find((d) => d.timing === 'today') ?? days[days.length - 1],
    lines: {
      food: toPesos(lines.food),
      transport: toPesos(lines.transport),
      school: toPesos(lines.school),
      other: toPesos(lines.other),
    },
    plannedTotal: toPesos(plannedTotal),
    spentByCategory: {
      food: toPesos(spentWeek.food),
      transport: toPesos(spentWeek.transport),
      school: toPesos(spentWeek.school),
      other: toPesos(spentWeek.other),
    },
    spentTotal: toPesos(spentTotal),
    usedUp: toPesos(usedUp),
    remainingPlanned: toPesos(remaining),
    savings: toPesos(savings),
    emergency: toPesos(emergency),
    protected: toPesos(savings + emergency),
    walletBalance,
    safeToSpend,
    shortfall,
    underPlan: toPesos(underPlanCents),
    status: underPlanCents >= 0 ? 'onTrack' : 'overPlan',
    daysLeft,
    perDay: daysLeft > 0 ? Math.floor(safeToSpend / daysLeft) : 0,
  };
}

/** What is left of a category's plan right now: today's share for daily categories, the week for school. */
export function categoryLeft(summary: WeekSummary, category: BudgetCategory): number {
  if (category === 'school') return Math.max(0, toPesos(toCents(summary.lines.school) - toCents(summary.spentByCategory.school)));
  const t = summary.today;
  return Math.max(0, toPesos(toCents(t.plan[category]) - toCents(t.spent[category])));
}

/** The next school day after today (looking into next week if needed). */
export function nextSchoolDay(
  plan: ConfirmedPlan,
  now: Date,
): { date: Date; weekday: Weekday; classHours?: ClassHours; budget: number } | null {
  if (plan.schoolDays.length === 0) return null;
  const today = startOfDay(now);
  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, i);
    const weekday = date.getDay() as Weekday;
    if (plan.schoolDays.includes(weekday)) {
      const ref = summarizeWeek({ plan, transactions: [], walletBalance: 0, now: date });
      return { date, weekday, classHours: plan.classHours[weekday], budget: ref.today.planTotal };
    }
  }
  return null;
}

/** When the next allowance arrives and how much it is. */
export function nextAllowance(plan: ConfirmedPlan, now: Date): { date: Date; amount: number } {
  if (plan.inputs.period === 'daily') return { date: addDays(startOfDay(now), 1), amount: plan.inputs.allowance };
  return {
    date: addDays(startOfWeek(now, plan.weekStartsOn), 7),
    amount: weeklyAllowance(plan.inputs.allowance, plan.inputs.period),
  };
}
