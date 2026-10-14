import { addDays, startOfWeek } from '@/services/budget/week';
import type { ConfirmedPlan } from '@/types/plan';

import { DEMO_WEEKLY_HISTORY } from './mock/demoData';

export type WeekTotal = { weekStart: Date; amount: number };

/**
 * Total spending in the weeks before the current one, oldest first.
 * Demo build: from services/mock until the Paiflow API serves wallet history.
 */
export function previousWeeks(plan: ConfirmedPlan, now: Date): WeekTotal[] {
  const current = startOfWeek(now, plan.weekStartsOn);
  const n = DEMO_WEEKLY_HISTORY.length;
  return DEMO_WEEKLY_HISTORY.map((amount, i) => ({ weekStart: addDays(current, -7 * (n - i)), amount }));
}
