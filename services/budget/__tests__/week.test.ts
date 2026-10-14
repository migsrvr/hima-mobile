import { demoWeekTransactions } from '@/services/mock/demoData';
import type { ConfirmedPlan } from '@/types/plan';

import { categoryLeft, nextAllowance, nextSchoolDay, startOfWeek, summarizeWeek } from '../week';

// README sample: Bea, ₱3,000 a week, school Mon / Wed / Fri, "today" = Wed 14 Oct 2026.
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
const WED_MORNING = new Date(2026, 9, 14, 9, 0);
const WEEK_START = new Date(2026, 9, 12);
const TXNS = demoWeekTransactions(WEEK_START, WED_MORNING);

const wed = (over: Partial<Parameters<typeof summarizeWeek>[0]> = {}) =>
  summarizeWeek({ plan: PLAN, transactions: TXNS, walletBalance: 2580, now: WED_MORNING, ...over });

describe('summarizeWeek (README Wednesday morning)', () => {
  it('finds the Monday-start week', () => {
    expect(startOfWeek(WED_MORNING, 1)).toEqual(WEEK_START);
    const s = wed();
    expect(s.start).toEqual(WEEK_START);
    expect(s.end).toEqual(new Date(2026, 9, 18));
    expect(s.today.date).toEqual(new Date(2026, 9, 14));
  });

  it('counts ₱420 spent by category, ignoring the failed payment', () => {
    const s = wed();
    expect(s.spentByCategory).toEqual({ food: 145, transport: 120, school: 60, other: 95 });
    expect(s.spentTotal).toBe(420);
    expect(s.plannedTotal).toBe(1290);
  });

  it('gives ₱860 remaining planned and ₱920 Safe-to-Spend', () => {
    const s = wed();
    expect(s.usedUp).toBe(430);
    expect(s.remainingPlanned).toBe(860);
    expect(s.protected).toBe(800);
    expect(s.safeToSpend).toBe(920);
    expect(s.shortfall).toBe(0);
  });

  it('is ₱10 under plan, about ₱184/day for 5 days', () => {
    const s = wed();
    expect(s.underPlan).toBe(10);
    expect(s.status).toBe('onTrack');
    expect(s.daysLeft).toBe(5);
    expect(s.perDay).toBe(184);
  });

  it('builds the day-by-day list from the design', () => {
    const [mon, tue, wedDay, thu, fri] = wed().days;
    expect([mon.kind, mon.timing, mon.spentPlanned, mon.planTotal, mon.underPlan]).toEqual(['school', 'past', 225, 230, 5]);
    expect([tue.kind, tue.spentPlanned, tue.planTotal, tue.underPlan]).toEqual(['free', 95, 100, 5]);
    expect([wedDay.timing, wedDay.spentPlanned, wedDay.planTotal]).toEqual(['today', 40, 230]);
    expect([thu.kind, thu.timing, thu.planTotal]).toEqual(['free', 'future', 100]);
    expect(fri.classHours).toEqual({ start: 600, end: 1020 });
  });

  it("reports what's left of today's plans", () => {
    const s = wed();
    expect(categoryLeft(s, 'food')).toBe(150);
    expect(categoryLeft(s, 'transport')).toBe(40);
    expect(categoryLeft(s, 'school')).toBe(140);
    expect(categoryLeft(s, 'other')).toBe(0);
  });

  it('starts the week at ₱910 before any spending', () => {
    const s = summarizeWeek({ plan: PLAN, transactions: [], walletBalance: 3000, now: new Date(2026, 9, 12, 6, 0) });
    expect(s.safeToSpend).toBe(910);
    expect(s.perDay).toBe(130);
  });

  it('takes overspending on a finished day out of Safe-to-Spend', () => {
    const extra = { ...TXNS[0], id: 'x', amount: 30, createdAt: new Date(2026, 9, 12, 18, 0).toISOString() };
    const s = wed({ transactions: [...TXNS, extra], walletBalance: 2550 });
    expect(s.underPlan).toBe(-20);
    expect(s.status).toBe('overPlan');
    expect(s.safeToSpend).toBe(890);
  });

  it('applies approved adjustments to the weekly lines', () => {
    const s = summarizeWeek({
      plan: { ...PLAN, adjustments: { transport: 50, other: -50 } },
      transactions: [],
      walletBalance: 3000,
      now: new Date(2026, 9, 12, 6, 0),
    });
    expect(s.lines.transport).toBe(290);
    expect(s.lines.other).toBe(350);
    expect(s.plannedTotal).toBe(1290);
    // ₱290 over 3 school days: 96.67 + 96.67 + 96.66
    expect(s.days.filter((d) => d.kind === 'school').map((d) => d.plan.transport)).toEqual([96.67, 96.67, 96.66]);
  });
});

describe('next school day and allowance', () => {
  it('finds Friday after Wednesday, then Monday after Friday', () => {
    expect(nextSchoolDay(PLAN, WED_MORNING)).toMatchObject({ date: new Date(2026, 9, 16), budget: 230 });
    expect(nextSchoolDay(PLAN, new Date(2026, 9, 16, 9))).toMatchObject({ date: new Date(2026, 9, 19) });
  });

  it('pays the next weekly allowance on Monday 19 Oct', () => {
    expect(nextAllowance(PLAN, WED_MORNING)).toEqual({ date: new Date(2026, 9, 19), amount: 3000 });
  });
});
