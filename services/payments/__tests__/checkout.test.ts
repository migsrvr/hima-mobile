import { demoWeekTransactions } from '@/services/mock/demoData';
import type { ConfirmedPlan } from '@/types/plan';

import { evaluateCheckout } from '../checkout';

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
  classHours: {},
  confirmedAt: '2026-10-11T00:00:00.000Z',
};
const NOW = new Date(2026, 9, 14, 12, 5);
const base = {
  plan: PLAN,
  transactions: demoWeekTransactions(new Date(2026, 9, 12), NOW),
  walletBalance: 2580,
  now: NOW,
};

describe('evaluateCheckout', () => {
  it('12a: ₱85 lunch is covered by today’s food plan; Safe-to-Spend unchanged', () => {
    const e = evaluateCheckout({ ...base, amount: 85, category: 'food' });
    expect(e.state).toBe('withinBudget');
    expect(e.fromPlan).toBe(85);
    expect(e.fromSafeToSpend).toBe(0);
    expect([e.planLeftBefore, e.planLeftAfter]).toEqual([150, 65]);
    expect([e.before.safeToSpend, e.after?.safeToSpend]).toEqual([920, 920]);
    expect(e.after?.walletBalance).toBe(2495);
  });

  it('12b: ₱1,150 textbook uses ₱140 school plan, ₱920 Safe-to-Spend, ₱90 reserve', () => {
    const e = evaluateCheckout({ ...base, amount: 1150, category: 'school' });
    expect(e.state).toBe('overSafeToSpend');
    expect(e.fromPlan).toBe(140);
    expect(e.fromSafeToSpend).toBe(920);
    expect(e.fromReserve).toBe(90);
    expect(e.fromSavings).toBe(0);
    expect([e.reserveBefore, e.reserveAfter]).toEqual([300, 210]);
    expect(e.after?.safeToSpend).toBe(0);
    expect(e.after?.walletBalance).toBe(1430);
  });

  it('12c: ₱3,200 is blocked, ₱620 short; ₱1,060 would fit without the reserve', () => {
    const e = evaluateCheckout({ ...base, amount: 3200, category: 'school' });
    expect(e.state).toBe('blocked');
    expect(e.shortBy).toBe(620);
    expect(e.after).toBeUndefined();
    expect(e.fitsWithoutReserve).toBe(1060);
  });

  it('dips into savings only after the whole emergency reserve', () => {
    const e = evaluateCheckout({ ...base, amount: 1500, category: 'school' });
    // 140 plan + 920 Safe-to-Spend + 300 reserve + 140 savings
    expect([e.fromPlan, e.fromSafeToSpend, e.fromReserve, e.fromSavings]).toEqual([140, 920, 300, 140]);
    expect(e.reserveAfter).toBe(0);
  });

  it('takes unplanned spending straight from Safe-to-Spend (₱150 snack on a school day)', () => {
    const e = evaluateCheckout({ ...base, amount: 150, category: 'other' });
    expect(e.fromPlan).toBe(0);
    expect(e.fromSafeToSpend).toBe(150);
    expect(e.after?.safeToSpend).toBe(770);
  });

  it('allows paying exactly the wallet balance', () => {
    expect(evaluateCheckout({ ...base, amount: 2580, category: 'other' }).state).not.toBe('blocked');
    expect(evaluateCheckout({ ...base, amount: 2580.01, category: 'other' }).state).toBe('blocked');
  });
});
