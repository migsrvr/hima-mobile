import { answerFor, checkoutNote, homeInsight, insightSuggestions, type AIContext } from '@/services/ai';
import { summarizeWeek } from '@/services/budget/week';
import { demoWeekTransactions } from '@/services/mock/demoData';
import { evaluateCheckout } from '@/services/payments/checkout';
import type { ConfirmedPlan } from '@/types/plan';

const PLAN: ConfirmedPlan = {
  inputs: {
    allowance: 3000,
    period: 'weekly',
    schoolDays: 3,
    foodPerSchoolDay: 150,
    transportPerSchoolDay: 80,
    schoolPerWeek: 200,
    freeDaySpend: 100,
    emergencyPerWeek: 300,
    savingsPerWeek: 500,
  },
  weekStartsOn: 1,
  schoolDays: [1, 3, 5],
  classHours: { 1: { start: 480, end: 900 }, 3: { start: 480, end: 900 }, 5: { start: 600, end: 1020 } },
  confirmedAt: '2026-10-11T00:00:00.000Z',
};

function ctxAt(now: Date): AIContext {
  const transactions = demoWeekTransactions(new Date(2026, 9, 12), now);
  const walletBalance = 2580;
  return { plan: PLAN, transactions, walletBalance, now, summary: summarizeWeek({ plan: PLAN, transactions, walletBalance, now }) };
}
const CTX = ctxAt(new Date(2026, 9, 14, 12, 20));

describe('Hima AI answers use calculated numbers', () => {
  it('answers "Can I afford ₱150 today?" like the 10 Hima AI design', () => {
    const a = answerFor('Can I afford ₱150 today?', CTX);
    expect(a.text).toBe('Yes. That leaves ₱770 Safe-to-Spend, about ₱192.50 a day through Sunday.');
    expect(a.calculated).toEqual([
      { label: 'Safe-to-Spend now', value: '₱920.00' },
      { label: 'After ₱150.00', value: '₱770.00' },
      { label: 'Per day, Thu–Sun', value: '₱192.50' },
    ]);
  });

  it('warns when an amount would use the reserve, and refuses more than the wallet', () => {
    expect(answerFor('Can I afford ₱1,000 today?', CTX).text).toContain('into your emergency reserve');
    expect(answerFor('Can I afford ₱5,000?', CTX).text).toBe('Not right now. ₱5,000.00 is more than your wallet holds.');
  });

  it('suggests moving ₱50 from Other to Transport, as a change to approve', () => {
    const a = answerFor('Can you improve my weekly budget?', CTX);
    expect(a.suggestion?.title).toBe('Move ₱50 a week from Other to Transport');
    expect(a.suggestion?.reason).toBe('Fares ran over 3 of the last 4 weeks.');
    expect(a.suggestion?.changes).toEqual([
      { category: 'transport', from: 240, to: 290 },
      { category: 'other', from: 400, to: 350 },
    ]);
    expect(a.suggestion?.adjustment).toEqual({ transport: 50, other: -50 });
  });

  it('checks whether money lasts until Friday from the plan', () => {
    const a = answerFor('Will my money last until Friday?', CTX);
    expect(a.text.startsWith('Yes.')).toBe(true);
    expect(a.calculated?.[1]).toEqual({ label: 'Planned through Fri', value: '₱520.00' });
  });
});

describe('Hima AI cards', () => {
  it('writes the Home insight from stored patterns and class hours', () => {
    const h = homeInsight(CTX);
    expect(h.runs.map((r) => r.text).join('')).toBe(
      'Your Wednesdays usually run ₱60 over plan, mostly snacks after class ends at 3 PM.',
    );
    expect(h.runs[1]).toEqual({ text: '₱60 over plan', strong: true });
    expect(h.footnote).toBe('Based on your last 4 Wednesdays');
  });

  it('writes the Insights suggestion like the design', () => {
    const [first] = insightSuggestions(CTX);
    expect(first.title).toBe('Wednesdays run ₱60 over plan');
    expect(first.body).toBe('Mostly snacks after class ends at 3 PM. A ₱60 snack cap on Wednesdays would cover it.');
  });

  it('writes the three checkout notes', () => {
    const at = new Date(2026, 9, 14, 12, 5);
    const c = ctxAt(at);
    const note = (amount: number, category: 'food' | 'school') =>
      checkoutNote(evaluateCheckout({ ...c, amount, category }), c);
    expect(note(85, 'food')).toBe("Lunch fits today's plan. You'll still have ₱65 for an afternoon snack.");
    expect(note(1150, 'school')).toBe('Your next allowance lands Monday. Buying it then keeps your reserve whole.');
    expect(note(3200, 'school')).toBe('Want to split it? Up to ₱1,060.00 fits this week without touching your reserve.');
  });
});
