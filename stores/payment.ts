import { create } from 'zustand';

import type { AuthMethod } from '@/services/biometric';
import { clock } from '@/services/clock';
import type { Merchant, MerchantOrder } from '@/services/payments/merchants';
import { paymentProcessor, type AutoSaved, type CheckoutQuote, type PaymentOutcome } from '@/services/payments/processor';

import { useWalletStore } from './wallet';

/**
 * One Tap to Pay session, from checkout to result.
 *   review -> submitting -> confirming -> confirmed | pending | failed
 * The result screen shows success only after 'confirmed' (network confirmation).
 */
export type PaymentPhase = 'review' | 'submitting' | 'confirming' | 'confirmed' | 'pending' | 'failed';

export type PaymentSession = {
  id: string;
  reference: string;
  merchant: Merchant;
  order: MerchantOrder;
  tagId: string;
  phase: PaymentPhase;
  /** Set when the student paid past Safe-to-Spend on purpose (12b "Pay anyway"). */
  usedOverride: boolean;
  /** How checkout said this payment would be covered (for the receipt note). */
  impact?: PaymentImpact;
  authMethod?: AuthMethod;
  authorizedAt?: string;
  submittedAt?: string;
  txHash?: string;
  /** Exact on-chain amount ("11.3333333") and its asset ("XLM"), from the server. */
  assetAmount?: string;
  assetCode?: string;
  ledger?: number;
  settledAt?: string;
  failureReason?: string;
  /** The server's price and 90/10 split, fetched when checkout opens (absent offline). */
  quote?: CheckoutQuote;
  /** The 10% auto-save and what the merchant received, from on-chain verification once confirmed. */
  autoSaved?: AutoSaved;
  merchantReceived?: PaymentOutcome['merchantReceived'];
  verification?: PaymentOutcome['verification'];
};

export type PaymentImpact = { fromPlan: number; fromSafeToSpend: number; fromReserve: number };

type PaymentState = {
  session: PaymentSession | null;
  start: (merchant: Merchant, order: MerchantOrder, tagId: string) => void;
  /** Asks the server for the price and split of the current checkout. Paying works without it. */
  loadQuote: () => Promise<void>;
  /** Called after the student authorizes; runs submission and confirmation. */
  pay: (method: AuthMethod, usedOverride: boolean, impact: PaymentImpact) => Promise<void>;
  checkStatus: () => Promise<void>;
  clear: () => void;
};

let sequence = 41;

/** "HM-1014-0042": month, day and a running number. */
function newReference(now: Date): string {
  sequence += 1;
  const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `HM-${mmdd}-${String(sequence).padStart(4, '0')}`;
}

const DEFAULT_FAILURE = 'The network rejected the payment';

export const usePaymentStore = create<PaymentState>()((set, get) => {
  const finish = (o: PaymentOutcome) => {
    const s = get().session;
    if (!s) return;
    const wallet = useWalletStore.getState();
    const failureReason = o.status === 'failed' ? (o.failureReason ?? DEFAULT_FAILURE) : undefined;
    if (o.status === 'confirmed') wallet.markConfirmed(s.id, o);
    if (o.status === 'failed') wallet.markFailed(s.id, failureReason as string);
    set({
      session: {
        ...s,
        phase: o.status,
        txHash: o.txHash ?? s.txHash,
        assetAmount: o.assetAmount ?? s.assetAmount,
        assetCode: o.assetCode ?? s.assetCode,
        ledger: o.ledger ?? s.ledger,
        settledAt: o.status === 'pending' ? undefined : clock.now().toISOString(),
        failureReason,
        autoSaved: o.autoSaved ?? s.autoSaved,
        merchantReceived: o.merchantReceived ?? s.merchantReceived,
        verification: o.verification ?? s.verification,
      },
    });
  };

  return {
    session: null,

    start: (merchant, order, tagId) => {
      const now = clock.now();
      set({
        session: {
          id: `pay-${now.getTime()}`,
          reference: newReference(now),
          merchant,
          order,
          tagId,
          phase: 'review',
          usedOverride: false,
        },
      });
    },

    loadQuote: async () => {
      const s = get().session;
      if (!s || s.phase !== 'review' || s.quote) return;
      try {
        const quote = await paymentProcessor.quote({ paymentId: s.id, merchantId: s.merchant.id, amount: s.order.amount, reference: s.reference });
        // Only attach it if the student is still on the same checkout.
        set((st) => (st.session?.id === s.id ? { session: { ...st.session, quote } } : st));
      } catch (e) {
        // Without a quote, checkout still pays (the server quotes and pays in one step); it just can't show the split.
        if (__DEV__) console.warn(`[checkout] No quote: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    },

    pay: async (method, usedOverride, impact) => {
      const s = get().session;
      if (!s || s.phase !== 'review') return;
      const authorizedAt = clock.now().toISOString();
      set({ session: { ...s, phase: 'submitting', authMethod: method, authorizedAt, usedOverride, impact } });

      // Held as pending from submission on, so Safe-to-Spend counts it straight away (14b).
      useWalletStore.getState().addPending({
        id: s.id,
        merchantName: s.merchant.name,
        merchantIcon: s.merchant.icon,
        category: s.merchant.category,
        amount: s.order.amount,
        direction: 'out',
        status: 'pending',
        createdAt: authorizedAt,
        description: s.order.description,
        reference: s.reference,
      });

      let outcome: PaymentOutcome;
      try {
        outcome = await paymentProcessor.submit(
          { paymentId: s.id, merchantId: s.merchant.id, amount: s.order.amount, reference: s.reference },
          { quoteId: get().session?.quote?.quoteId },
        );
        if (outcome.txHash) {
          useWalletStore.getState().markSubmitted(s.id, outcome.txHash, outcome);
          set((st) => ({
            session: st.session && {
              ...st.session,
              phase: 'confirming',
              txHash: outcome.txHash,
              assetAmount: outcome.assetAmount,
              assetCode: outcome.assetCode,
              submittedAt: clock.now().toISOString(),
            },
          }));
          if (outcome.status === 'pending') outcome = await paymentProcessor.waitForConfirmation(s.id, outcome.txHash);
        }
      } catch {
        // The processors report outcomes instead of throwing; anything unexpected is unknown, not failed.
        outcome = { status: 'pending' };
      }
      finish(outcome);
    },

    checkStatus: async () => {
      const s = get().session;
      if (!s || s.phase !== 'pending') return;
      finish(await paymentProcessor.checkStatus(s.id, s.txHash));
    },

    clear: () => set({ session: null }),
  };
});
