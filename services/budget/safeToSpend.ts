/**
 * Safe-to-Spend = wallet balance − remaining planned expenses this period − protected reserves.
 *
 * Deterministic and UI-free. All math runs in whole centavos so results never
 * pick up floating-point noise.
 */

export const toCents = (pesos: number) => Math.round(pesos * 100);
export const toPesos = (cents: number) => cents / 100;

export type SafeToSpendInput = {
  walletBalance: number;
  /** Planned spending still to come this period (not yet spent). */
  remainingPlanned: number;
  /** Savings + emergency reserve. Never counted as spendable. */
  protectedReserves: number;
};

export type SafeToSpendResult = {
  /** What can be spent without touching the plan or the reserves. Never below zero. */
  safeToSpend: number;
  /** How far the plan and reserves exceed the wallet (0 when they fit). */
  shortfall: number;
};

export function computeSafeToSpend({ walletBalance, remainingPlanned, protectedReserves }: SafeToSpendInput): SafeToSpendResult {
  const raw = toCents(walletBalance) - toCents(remainingPlanned) - toCents(protectedReserves);
  return {
    safeToSpend: toPesos(Math.max(0, raw)),
    shortfall: toPesos(Math.max(0, -raw)),
  };
}
