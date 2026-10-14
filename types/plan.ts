import type { PlanInputs } from '@/services/budget/plan';

import type { BudgetCategory } from './finance';
import type { ClassHours, Weekday } from './schedule';

/** The plan a student confirmed on 06 Budget. Nothing is saved before that. */
export type ConfirmedPlan = {
  inputs: PlanInputs;
  weekStartsOn: Weekday;
  schoolDays: Weekday[];
  classHours: Partial<Record<Weekday, ClassHours>>;
  confirmedAt: string;
  /**
   * Weekly amounts moved between categories after an approved Hima AI suggestion
   * (e.g. transport +50, other −50). Applied on top of the inputs.
   */
  adjustments?: Partial<Record<BudgetCategory, number>>;
};
