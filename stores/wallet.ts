import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ApiError, apiFetch } from '@/services/api';
import { weeklyAllowance } from '@/services/budget/plan';
import { toCents, toPesos } from '@/services/budget/safeToSpend';
import { addDays, startOfWeek } from '@/services/budget/week';
import { DEMO_SEED_ACTIVITY } from '@/services/mock/config';
import { demoWeekTransactions } from '@/services/mock/demoData';
import { paymentProcessor, type PaymentOutcome } from '@/services/payments/processor';
import type { Transaction } from '@/types/finance';
import type { ConfirmedPlan } from '@/types/plan';
import { startOfDay } from '@/utils/date';

import { appStorage } from './storage';

/** Allowance arriving in the wallet. */
export type Deposit = { id: string; amount: number; createdAt: string; note: string };

/** Hima's testnet paying wallet, as the server last reported it (kept for offline display). */
export type ChainWallet = {
  publicKey: string;
  /** Seven-decimal balance of the flow's input asset; null when the server couldn't read it. */
  balance: string | null;
  assetCode: string;
  /** Fixed demo rate, PHP per unit of the asset ("7.50"). */
  phpPerUnit: string;
  deploymentId: string;
  triggerContract?: string;
  readAt: string;
};

/**
 * checking: not asked yet this session. connected: server, wallet and Paiflow answered.
 * notSetUp: the server answered but payments aren't configured. offline: no usable answer.
 */
export type ChainConnection = 'checking' | 'connected' | 'notSetUp' | 'offline';

/** GET /api/wallet/stellar (server/src/services/walletService.ts WalletView). */
type WalletView = {
  publicKey: string;
  asset: { code: string };
  balance: string | null;
  balanceError?: 'HORIZON_UNAVAILABLE' | 'ACCOUNT_NOT_FUNDED';
  phpPerUnit: string;
  /** The checkout deployment; `ready` is false when it can't take payments (for example a USDC flow). */
  paiflow: { configured: boolean; ready?: boolean; problems?: string[]; deploymentId: string; triggerContract?: string };
  readAt: string;
};

type WalletState = {
  ownerId: string | null;
  deposits: Deposit[];
  transactions: Transaction[];
  chain: ChainWallet | null;
  connection: ChainConnection;
  /**
   * Makes sure the student's wallet exists and this period's allowance has landed.
   * The demo build also seeds the README sample week once per new wallet.
   */
  ensure: (userId: string, plan: ConfirmedPlan, now: Date) => void;
  addPending: (tx: Transaction) => void;
  markSubmitted: (id: string, txHash: string, details?: Pick<PaymentOutcome, 'assetAmount' | 'assetCode'>) => void;
  markConfirmed: (id: string, details?: Pick<PaymentOutcome, 'txHash' | 'ledger' | 'assetAmount' | 'assetCode' | 'autoSaved'>) => void;
  markFailed: (id: string, reason: string) => void;
  /** Reads the testnet wallet, demo rate and connection from the server. */
  refreshChain: () => Promise<void>;
  /** Settles payments left pending (for example after a restart). `skipId` is the payment on screen. */
  reconcilePending: (skipId?: string) => Promise<void>;
};

/** Deposits minus every charge that is confirmed or still pending. Failed payments never count. */
export function walletBalance(s: Pick<WalletState, 'deposits' | 'transactions'>): number {
  let cents = s.deposits.reduce((sum, d) => sum + toCents(d.amount), 0);
  for (const t of s.transactions) {
    if (t.status === 'failed') continue;
    cents += (t.direction === 'in' ? 1 : -1) * toCents(t.amount);
  }
  return toPesos(cents);
}

/** Allowance deposits owed up to `now`: one per week, or one per day for a daily allowance. */
function dueDeposits(plan: ConfirmedPlan, now: Date): Deposit[] {
  const weekStart = startOfWeek(now, plan.weekStartsOn);
  if (plan.inputs.period === 'weekly') {
    return [
      {
        id: `allowance-${weekStart.toISOString()}`,
        amount: weeklyAllowance(plan.inputs.allowance, 'weekly'),
        createdAt: weekStart.toISOString(),
        note: 'Weekly allowance',
      },
    ];
  }
  const out: Deposit[] = [];
  for (let d = weekStart; d <= startOfDay(now); d = addDays(d, 1)) {
    out.push({ id: `allowance-${d.toISOString()}`, amount: plan.inputs.allowance, createdAt: d.toISOString(), note: 'Daily allowance' });
  }
  return out;
}

const update = (list: Transaction[], id: string, patch: Partial<Transaction>) =>
  list.map((t) => (t.id === id ? { ...t, ...patch } : t));

/** Drops undefined fields so a patch never erases what is already known. */
const defined = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

let reconciling = false;

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      deposits: [],
      transactions: [],
      chain: null,
      connection: 'checking',

      ensure: (userId, plan, now) => {
        const s = get();
        const fresh = s.ownerId !== userId;
        const deposits = fresh ? [] : s.deposits;
        const missing = dueDeposits(plan, now).filter((d) => !deposits.some((x) => x.id === d.id));
        if (!fresh && missing.length === 0) return;
        const seeded = fresh && DEMO_SEED_ACTIVITY ? demoWeekTransactions(startOfWeek(now, plan.weekStartsOn), now) : [];
        set({
          ownerId: userId,
          deposits: [...deposits, ...missing],
          transactions: fresh ? seeded : s.transactions,
        });
      },

      addPending: (tx) => set((s) => ({ transactions: [...s.transactions, { ...tx, status: 'pending' }] })),
      markSubmitted: (id, txHash, details = {}) =>
        set((s) => ({ transactions: update(s.transactions, id, defined({ txHash, assetAmount: details.assetAmount, assetCode: details.assetCode })) })),
      markConfirmed: (id, details = {}) =>
        set((s) => ({
          transactions: update(s.transactions, id, {
            ...defined({
              txHash: details.txHash,
              ledger: details.ledger,
              assetAmount: details.assetAmount,
              assetCode: details.assetCode,
              // The full price still leaves the wallet; this part landed in the savings wallet.
              autoSaved: details.autoSaved?.amount,
            }),
            status: 'confirmed',
            failureReason: undefined,
          }),
        })),
      markFailed: (id, reason) =>
        set((s) => ({ transactions: update(s.transactions, id, { status: 'failed', failureReason: reason }) })),

      refreshChain: async () => {
        try {
          const w = await apiFetch<WalletView>('/api/wallet/stellar', { timeoutMs: 10_000 });
          set({
            chain: {
              publicKey: w.publicKey,
              balance: w.balance,
              assetCode: w.asset.code,
              phpPerUnit: w.phpPerUnit,
              deploymentId: w.paiflow.deploymentId,
              triggerContract: w.paiflow.triggerContract,
              readAt: w.readAt,
            },
            connection:
              !w.paiflow.configured || w.paiflow.ready === false || w.balanceError === 'ACCOUNT_NOT_FUNDED'
                ? 'notSetUp'
                : w.balanceError === 'HORIZON_UNAVAILABLE'
                  ? 'offline'
                  : 'connected',
          });
        } catch (e) {
          // 503 = the server is up but its testnet wallet isn't configured yet.
          set({ connection: e instanceof ApiError && e.kind === 'http' && e.status === 503 ? 'notSetUp' : 'offline' });
        }
      },

      reconcilePending: async (skipId) => {
        if (reconciling) return;
        reconciling = true;
        try {
          const pending = get().transactions.filter(
            (t) => t.status === 'pending' && t.direction === 'out' && t.id !== skipId && !t.id.startsWith('demo-'),
          );
          for (const t of pending) {
            const o = await paymentProcessor.checkStatus(t.id, t.txHash);
            if (o.status === 'confirmed') get().markConfirmed(t.id, o);
            else if (o.status === 'failed') get().markFailed(t.id, o.failureReason ?? 'The network rejected the payment');
            else if (o.txHash && !t.txHash) get().markSubmitted(t.id, o.txHash, o);
          }
        } finally {
          reconciling = false;
        }
      },
    }),
    {
      name: 'hima.wallet',
      storage: appStorage,
      version: 2,
      partialize: (s) => ({ ownerId: s.ownerId, deposits: s.deposits, transactions: s.transactions, chain: s.chain }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          // v1 kept a placeholder 0x address and fake hashes on the seeded sample week.
          delete state.address;
          state.chain = null;
          state.transactions = ((state.transactions as Transaction[] | undefined) ?? []).map((t) =>
            t.id.startsWith('demo-') ? { ...t, txHash: undefined } : t,
          );
        }
        return state as unknown as WalletState;
      },
    },
  ),
);
