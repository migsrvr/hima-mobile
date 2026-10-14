import type { SpendingStatus } from '@/types/finance';

/**
 * Share of a category plan at which Hima starts warning (amber bar, "88% used").
 * Product assumption: the design shows 88% as a warning and 50% as on track.
 */
export const NEAR_LIMIT_RATIO = 0.8;

/** Deterministic status for a category: over plan, near its limit, or on track. */
export function spendingStatus(spent: number, planned: number): SpendingStatus {
  if (spent > planned) return 'over';
  if (planned > 0 && spent / planned >= NEAR_LIMIT_RATIO) return 'nearLimit';
  return 'onTrack';
}

/** Whole-number percent of the plan used (210 of 240 -> 88). */
export function percentUsed(spent: number, planned: number): number {
  if (planned <= 0) return spent > 0 ? 100 : 0;
  return Math.round((spent / planned) * 100);
}
