import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { clock } from '@/services/clock';
import type { BudgetCategory } from '@/types/finance';
import type { ConfirmedPlan } from '@/types/plan';

import { appStorage } from './storage';

export type { ConfirmedPlan } from '@/types/plan';

type PlanState = {
  /** Confirmed plans by user id (one device can hold more than one account). */
  plans: Record<string, ConfirmedPlan>;
  confirm: (userId: string, plan: Omit<ConfirmedPlan, 'confirmedAt' | 'adjustments'>) => void;
  /** Applies an approved change. Only ever called from an explicit Approve. */
  applyAdjustment: (userId: string, change: Partial<Record<BudgetCategory, number>>) => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plans: {},
      confirm: (userId, plan) =>
        set((s) => ({
          plans: {
            ...s.plans,
            // Re-confirming after an edit keeps earlier approved adjustments.
            [userId]: { ...plan, adjustments: s.plans[userId]?.adjustments, confirmedAt: clock.now().toISOString() },
          },
        })),
      applyAdjustment: (userId, change) =>
        set((s) => {
          const current = s.plans[userId];
          if (!current) return s;
          const adjustments = { ...current.adjustments };
          for (const [k, v] of Object.entries(change) as [BudgetCategory, number][]) {
            adjustments[k] = Math.round(((adjustments[k] ?? 0) + v) * 100) / 100;
          }
          return { plans: { ...s.plans, [userId]: { ...current, adjustments } } };
        }),
    }),
    { name: 'hima.plan', storage: appStorage, version: 1 },
  ),
);
