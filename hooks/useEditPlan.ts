import { router, type Href } from 'expo-router';

import { useOnboardingStore } from '@/stores/onboarding';
import { usePlanStore } from '@/stores/plan';
import { useSessionStore } from '@/stores/session';

type Step = '/allowance' | '/school-days' | '/expenses';

/**
 * Opens a setup step pre-filled with the confirmed plan. Changes only take effect
 * when the student confirms the recalculated plan on 06 Budget.
 */
export function useEditPlan(): (step: Step) => void {
  const userId = useSessionStore((s) => s.session?.user.id);
  return (step) => {
    const plan = userId ? usePlanStore.getState().plans[userId] : undefined;
    if (plan) useOnboardingStore.getState().loadFromPlan(plan);
    router.push(step as Href);
  };
}
