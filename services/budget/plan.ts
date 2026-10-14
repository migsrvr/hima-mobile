import { computeSafeToSpend, toCents, toPesos } from './safeToSpend';

export type AllowancePeriod = 'daily' | 'weekly';

/** Everything the onboarding flow collects, as numbers. */
export type PlanInputs = {
  allowance: number;
  period: AllowancePeriod;
  /** School days per week (0–7). */
  schoolDays: number;
  foodPerSchoolDay: number;
  transportPerSchoolDay: number;
  schoolPerWeek: number;
  /** Spending on each non-school day. */
  freeDaySpend: number;
  emergencyPerWeek: number;
  savingsPerWeek: number;
};

export type WeeklyPlan = {
  weeklyAllowance: number;
  schoolDays: number;
  freeDays: number;
  /** Weekly amount per spending line. */
  food: number;
  transport: number;
  school: number;
  freeDaySpending: number;
  /** food + transport + school + free days. */
  planned: number;
  savings: number;
  emergency: number;
  /** savings + emergency. */
  protected: number;
  /** allowance − planned − protected, never below zero. */
  safeToSpend: number;
  /** safeToSpend / 7. */
  safePerDay: number;
  /** planned + protected − allowance when the plan does not fit, else 0. */
  overBy: number;
  /** planned + protected. */
  needed: number;
  /** Budget for one school day (food + transport) and one free day. */
  schoolDayBudget: number;
  freeDayBudget: number;
  /**
   * Shares for the allowance split bar (sum to 1). When the plan fits, the bar is the
   * allowance: planned / protected / Safe-to-Spend. When it doesn't, the bar is what the
   * plan needs: planned / protected covered by the allowance / the shortfall.
   */
  split: { planned: number; protected: number; last: number };
};

/** Weekly allowance: a daily allowance covers all seven days. */
export function weeklyAllowance(allowance: number, period: AllowancePeriod): number {
  return toPesos(toCents(allowance) * (period === 'daily' ? 7 : 1));
}

export function buildWeeklyPlan(i: PlanInputs): WeeklyPlan {
  const schoolDays = Math.max(0, Math.min(7, Math.round(i.schoolDays)));
  const freeDays = 7 - schoolDays;
  const c = {
    allowance: toCents(weeklyAllowance(i.allowance, i.period)),
    food: toCents(i.foodPerSchoolDay) * schoolDays,
    transport: toCents(i.transportPerSchoolDay) * schoolDays,
    school: toCents(i.schoolPerWeek),
    freeDays: toCents(i.freeDaySpend) * freeDays,
    savings: toCents(i.savingsPerWeek),
    emergency: toCents(i.emergencyPerWeek),
  };
  const planned = c.food + c.transport + c.school + c.freeDays;
  const protectedReserves = c.savings + c.emergency;
  const needed = planned + protectedReserves;

  // At the start of the week the wallet holds the allowance and nothing of the plan is spent yet.
  const { safeToSpend, shortfall } = computeSafeToSpend({
    walletBalance: toPesos(c.allowance),
    remainingPlanned: toPesos(planned),
    protectedReserves: toPesos(protectedReserves),
  });
  const safeCents = toCents(safeToSpend);
  const overCents = toCents(shortfall);

  let split: WeeklyPlan['split'];
  if (overCents > 0) {
    const coveredPlanned = Math.min(planned, c.allowance);
    const coveredProtected = Math.max(0, c.allowance - coveredPlanned);
    split = { planned: coveredPlanned / needed, protected: coveredProtected / needed, last: overCents / needed };
  } else if (c.allowance > 0) {
    split = { planned: planned / c.allowance, protected: protectedReserves / c.allowance, last: safeCents / c.allowance };
  } else {
    split = { planned: 0, protected: 0, last: 0 };
  }

  return {
    weeklyAllowance: toPesos(c.allowance),
    schoolDays,
    freeDays,
    food: toPesos(c.food),
    transport: toPesos(c.transport),
    school: toPesos(c.school),
    freeDaySpending: toPesos(c.freeDays),
    planned: toPesos(planned),
    savings: toPesos(c.savings),
    emergency: toPesos(c.emergency),
    protected: toPesos(protectedReserves),
    safeToSpend,
    safePerDay: toPesos(Math.floor(safeCents / 7)),
    overBy: shortfall,
    needed: toPesos(needed),
    schoolDayBudget: toPesos(toCents(i.foodPerSchoolDay) + toCents(i.transportPerSchoolDay)),
    freeDayBudget: toPesos(toCents(i.freeDaySpend)),
    split,
  };
}

export type QuickFixField = 'savingsPerWeek' | 'freeDaySpend' | 'foodPerSchoolDay';

export type QuickFix = {
  field: QuickFixField;
  from: number;
  to: number;
};

/**
 * Ways to close an over-allowance gap by changing one number (06b). Each fix on its
 * own makes the plan fit. Per-day cuts round up to the centavo so the gap is fully
 * closed. Fixes that would push a value below zero are left out.
 */
export function quickFixes(i: PlanInputs): QuickFix[] {
  const plan = buildWeeklyPlan(i);
  const gap = toCents(plan.overBy);
  if (gap <= 0) return [];
  const fixes: QuickFix[] = [];
  const add = (field: QuickFixField, fromPesos: number, cutCents: number) => {
    const to = toCents(fromPesos) - cutCents;
    if (to >= 0) fixes.push({ field, from: fromPesos, to: toPesos(to) });
  };
  add('savingsPerWeek', i.savingsPerWeek, gap);
  if (plan.freeDays > 0) add('freeDaySpend', i.freeDaySpend, Math.ceil(gap / plan.freeDays));
  if (plan.schoolDays > 0) add('foodPerSchoolDay', i.foodPerSchoolDay, Math.ceil(gap / plan.schoolDays));
  return fixes;
}
