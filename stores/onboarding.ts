import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AllowancePeriod, PlanInputs, QuickFixField } from '@/services/budget/plan';
import type { ConfirmedPlan } from '@/types/plan';
import type { ClassHours, Weekday } from '@/types/schedule';
import { parseAmount } from '@/utils/money';

import { appStorage } from './storage';

export type ExpenseKey = 'food' | 'transport' | 'school' | 'freeDay' | 'emergency' | 'savings';

/**
 * What the student typed during setup. Money stays as raw strings ("3000.5") so
 * fields can be edited freely; screens turn them into numbers with toPlanInputs.
 * Starts empty: first-time values are always entered by the student.
 */
export type OnboardingDraft = {
  allowance: string;
  period: AllowancePeriod;
  weekStartsOn: Weekday;
  schoolDays: Weekday[];
  classHours: Partial<Record<Weekday, ClassHours>>;
  expenses: Record<ExpenseKey, string>;
};

type OnboardingState = OnboardingDraft & {
  setAllowance: (raw: string) => void;
  setPeriod: (period: AllowancePeriod) => void;
  setWeekStartsOn: (day: Weekday) => void;
  toggleSchoolDay: (day: Weekday) => void;
  setClassHours: (day: Weekday, hours: ClassHours | undefined) => void;
  setExpense: (key: ExpenseKey, raw: string) => void;
  /** Applies a 06b quick fix chosen by the student. */
  applyQuickFix: (field: QuickFixField, value: number) => void;
  /** Fills the setup screens with a confirmed plan so it can be edited from Schedule or Profile. */
  loadFromPlan: (plan: ConfirmedPlan) => void;
  reset: () => void;
};

export const EMPTY_DRAFT: OnboardingDraft = {
  allowance: '',
  period: 'weekly',
  weekStartsOn: 1,
  schoolDays: [],
  classHours: {},
  expenses: { food: '', transport: '', school: '', freeDay: '', emergency: '', savings: '' },
};

const FIX_TO_EXPENSE: Record<QuickFixField, ExpenseKey> = {
  savingsPerWeek: 'savings',
  freeDaySpend: 'freeDay',
  foodPerSchoolDay: 'food',
};

/** Raw string for a number, without trailing zeros ("77.5", "410"). */
const toRaw = (value: number) => String(Math.round(value * 100) / 100);

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...EMPTY_DRAFT,
      setAllowance: (allowance) => set({ allowance }),
      setPeriod: (period) => set({ period }),
      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
      toggleSchoolDay: (day) =>
        set((s) => ({
          schoolDays: s.schoolDays.includes(day) ? s.schoolDays.filter((d) => d !== day) : [...s.schoolDays, day],
        })),
      setClassHours: (day, hours) =>
        set((s) => {
          const next = { ...s.classHours };
          if (hours) next[day] = hours;
          else delete next[day];
          return { classHours: next };
        }),
      setExpense: (key, raw) => set((s) => ({ expenses: { ...s.expenses, [key]: raw } })),
      applyQuickFix: (field, value) =>
        set((s) => ({ expenses: { ...s.expenses, [FIX_TO_EXPENSE[field]]: toRaw(value) } })),
      loadFromPlan: (plan) =>
        set({
          allowance: toRaw(plan.inputs.allowance),
          period: plan.inputs.period,
          weekStartsOn: plan.weekStartsOn,
          schoolDays: [...plan.schoolDays],
          classHours: { ...plan.classHours },
          expenses: {
            food: toRaw(plan.inputs.foodPerSchoolDay),
            transport: toRaw(plan.inputs.transportPerSchoolDay),
            school: toRaw(plan.inputs.schoolPerWeek),
            freeDay: toRaw(plan.inputs.freeDaySpend),
            emergency: toRaw(plan.inputs.emergencyPerWeek),
            savings: toRaw(plan.inputs.savingsPerWeek),
          },
        }),
      reset: () => set(EMPTY_DRAFT),
    }),
    { name: 'hima.onboarding', storage: appStorage, version: 1 },
  ),
);

/** Numbers for the plan calculation. Empty fields count as zero. */
export function toPlanInputs(d: OnboardingDraft): PlanInputs {
  const n = (raw: string) => parseAmount(raw) ?? 0;
  return {
    allowance: n(d.allowance),
    period: d.period,
    schoolDays: d.schoolDays.length,
    foodPerSchoolDay: n(d.expenses.food),
    transportPerSchoolDay: n(d.expenses.transport),
    schoolPerWeek: n(d.expenses.school),
    freeDaySpend: n(d.expenses.freeDay),
    emergencyPerWeek: n(d.expenses.emergency),
    savingsPerWeek: n(d.expenses.savings),
  };
}
