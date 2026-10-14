import { buildWeeklyPlan, quickFixes, weeklyAllowance, type PlanInputs } from '../plan';
import { computeSafeToSpend } from '../safeToSpend';

// Sample student from design/README.md: Bea, ₱3,000 a week, school on Mon/Wed/Fri.
const BEA: PlanInputs = {
  allowance: 3000,
  period: 'weekly',
  schoolDays: 3,
  foodPerSchoolDay: 150,
  transportPerSchoolDay: 80,
  schoolPerWeek: 200,
  freeDaySpend: 100,
  emergencyPerWeek: 300,
  savingsPerWeek: 500,
};

describe('computeSafeToSpend', () => {
  it('is wallet − remaining planned − protected (README: start of week)', () => {
    expect(computeSafeToSpend({ walletBalance: 3000, remainingPlanned: 1290, protectedReserves: 800 })).toEqual({
      safeToSpend: 910,
      shortfall: 0,
    });
  });

  it('matches Wednesday morning in the README', () => {
    // ₱420 spent (₱10 under plan), wallet ₱2,580, remaining planned ₱860
    expect(computeSafeToSpend({ walletBalance: 2580, remainingPlanned: 860, protectedReserves: 800 }).safeToSpend).toBe(920);
  });

  it('never goes below zero and reports the shortfall', () => {
    expect(computeSafeToSpend({ walletBalance: 2000, remainingPlanned: 1290, protectedReserves: 800 })).toEqual({
      safeToSpend: 0,
      shortfall: 90,
    });
  });

  it('works in centavos', () => {
    expect(computeSafeToSpend({ walletBalance: 0.3, remainingPlanned: 0.1, protectedReserves: 0.1 }).safeToSpend).toBe(0.1);
  });
});

describe('buildWeeklyPlan', () => {
  it('builds the 06 Budget plan from the README sample', () => {
    const p = buildWeeklyPlan(BEA);
    expect(p.weeklyAllowance).toBe(3000);
    expect([p.food, p.transport, p.school, p.freeDaySpending]).toEqual([450, 240, 200, 400]);
    expect(p.planned).toBe(1290);
    expect(p.protected).toBe(800);
    expect(p.safeToSpend).toBe(910);
    expect(p.safePerDay).toBe(130);
    expect(p.overBy).toBe(0);
    expect(p.schoolDayBudget).toBe(230);
    expect(p.freeDayBudget).toBe(100);
    expect(p.freeDays).toBe(4);
  });

  it('splits the allowance bar 43 / 27 / 30', () => {
    const { split } = buildWeeklyPlan(BEA);
    expect(Math.round(split.planned * 100)).toBe(43);
    expect(Math.round(split.protected * 100)).toBe(27);
    expect(Math.round(split.last * 100)).toBe(30);
    expect(split.planned + split.protected + split.last).toBeCloseTo(1, 10);
  });

  it('flags a plan over the allowance (06b: ₱2,000 a week)', () => {
    const p = buildWeeklyPlan({ ...BEA, allowance: 2000 });
    expect(p.overBy).toBe(90);
    expect(p.safeToSpend).toBe(0);
    expect(p.needed).toBe(2090);
    expect(Math.round(p.split.planned * 100)).toBe(62);
    expect(Math.round(p.split.protected * 100)).toBe(34);
    expect(Math.round(p.split.last * 100)).toBe(4);
  });

  it('handles planned spending alone above the allowance', () => {
    const p = buildWeeklyPlan({ ...BEA, allowance: 1000 });
    expect(p.overBy).toBe(1090);
    expect(p.split.protected).toBe(0);
    expect(p.split.planned + p.split.last).toBeCloseTo(1, 10);
  });

  it('turns a daily allowance into a weekly one', () => {
    expect(weeklyAllowance(300, 'daily')).toBe(2100);
    expect(buildWeeklyPlan({ ...BEA, allowance: 450, period: 'daily' }).weeklyAllowance).toBe(3150);
  });

  it('copes with no school days and an empty allowance', () => {
    const p = buildWeeklyPlan({ ...BEA, schoolDays: 0, allowance: 0 });
    expect(p.food).toBe(0);
    expect(p.freeDaySpending).toBe(700);
    expect(p.safeToSpend).toBe(0);
    expect(p.overBy).toBe(1700);
  });
});

describe('quickFixes', () => {
  it('offers the three 06b fixes, each closing the ₱90 gap', () => {
    const inputs = { ...BEA, allowance: 2000 };
    const fixes = quickFixes(inputs);
    expect(fixes).toEqual([
      { field: 'savingsPerWeek', from: 500, to: 410 },
      { field: 'freeDaySpend', from: 100, to: 77.5 },
      { field: 'foodPerSchoolDay', from: 150, to: 120 },
    ]);
    for (const f of fixes) {
      const fixed = buildWeeklyPlan({ ...inputs, [f.field]: f.to });
      expect(fixed.overBy).toBe(0);
    }
  });

  it('rounds per-day cuts up so the gap is fully closed', () => {
    const inputs = { ...BEA, allowance: 2000 - 0.01 }; // gap ₱90.01
    const free = quickFixes(inputs).find((f) => f.field === 'freeDaySpend')!;
    expect(buildWeeklyPlan({ ...inputs, freeDaySpend: free.to }).overBy).toBe(0);
  });

  it('skips fixes that would go below zero, and returns none when the plan fits', () => {
    // ₱1,500 allowance with ₱50 savings: gap ₱140 is more than the savings.
    const fixes = quickFixes({ ...BEA, allowance: 1500, savingsPerWeek: 50 });
    expect(fixes.map((f) => f.field)).toEqual(['freeDaySpend', 'foodPerSchoolDay']);
    expect(fixes[1].to).toBe(103.33);
    expect(quickFixes(BEA)).toEqual([]);
  });
});
