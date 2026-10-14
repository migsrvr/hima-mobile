import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { AIContext } from '@/services/ai';
import { summarizeWeek } from '@/services/budget/week';
import { usePlanStore } from '@/stores/plan';
import { useSessionStore } from '@/stores/session';
import { useWalletStore, walletBalance, type ChainWallet } from '@/stores/wallet';
import type { User } from '@/types/user';

import { useNow } from './useNow';
import { usePersistHydrated } from './usePersistHydrated';

export type BudgetContext = AIContext & {
  user: User;
  /** Hima's testnet wallet and demo rate as the server last reported them; null until first read. */
  chain: ChainWallet | null;
};

/**
 * Everything the signed-in screens show, computed from stores and services/budget.
 * Returns null until saved data has loaded (and for a student without a plan).
 */
export function useBudget(): BudgetContext | null {
  const user = useSessionStore((s) => s.session?.user ?? null);
  const plansReady = usePersistHydrated(usePlanStore);
  const walletReady = usePersistHydrated(useWalletStore);
  const plan = usePlanStore((s) => (user ? s.plans[user.id] : undefined));
  const wallet = useWalletStore(
    useShallow((s) => ({ ownerId: s.ownerId, chain: s.chain, deposits: s.deposits, transactions: s.transactions })),
  );
  const now = useNow();

  useEffect(() => {
    if (user && plan && walletReady) useWalletStore.getState().ensure(user.id, plan, now);
  }, [user, plan, walletReady, now]);

  if (!user || !plan || !plansReady || !walletReady || wallet.ownerId !== user.id) return null;

  const balance = walletBalance(wallet);
  return {
    user,
    plan,
    now,
    chain: wallet.chain,
    transactions: wallet.transactions,
    walletBalance: balance,
    summary: summarizeWeek({ plan, transactions: wallet.transactions, walletBalance: balance, now }),
  };
}
