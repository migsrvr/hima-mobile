import { Platform } from 'react-native';

import { ApiError, apiFetch, getApiSessionGeneration } from '@/services/api';
import { formatStroopsDecimal, splitByPercents, toStroops } from '@/utils/asset';

import { explorerTxUrl } from './network';

/** Final network answer for a submitted payment. */
export type ConfirmationResult = 'confirmed' | 'pending' | 'failed';

/** One leg of the checkout Split: 90% to the merchant, 10% to the student's savings. */
export type SplitLine = {
  role: 'merchant' | 'savings' | 'spending' | 'emergency';
  label: string;
  percent: number;
  /** PHP share of the price. */
  amount: number;
  /** Seven-decimal XLM share as the Split pays it. */
  assetAmount: string;
};

/** The student's 10% auto-save; `verified` once Horizon shows the savings wallet was credited. */
export type AutoSaved = { amount: number; assetAmount: string; verified: boolean };

/** A priced checkout held for the student's authorization (nothing is sent yet). */
export type CheckoutQuote = { quoteId: string; split: SplitLine[]; autoSaved: AutoSaved | null };

export type PaymentOutcome = {
  status: ConfirmationResult;
  /** Known once the signed payment exists; a payment refused before that has none. */
  txHash?: string;
  ledger?: number;
  /** Exact on-chain amount ("11.3333333") and its asset ("XLM"). */
  assetAmount?: string;
  assetCode?: string;
  /** Short reason for 14c, set when failed. */
  failureReason?: string;
  autoSaved?: AutoSaved;
  /** What the merchant was credited on-chain, once verified. */
  merchantReceived?: { label: string; assetAmount: string };
  /** Whether the on-chain Split matched the flow (checked on Horizon after confirmation). */
  verification?: 'verified' | 'mismatch' | 'unavailable';
};

export type PaymentRequest = { paymentId: string; merchantId: string; amount: number; reference: string };

export interface PaymentProcessor {
  /** Prices a checkout and its split. Optional: `submit` works without it. */
  quote(request: PaymentRequest): Promise<CheckoutQuote>;
  /** Sends an authorized payment (the quote, when there is one). Resolves once the network has it, or with an earlier final answer. */
  submit(request: PaymentRequest, options?: { quoteId?: string }): Promise<PaymentOutcome>;
  /** Follows a submitted payment until it is final, or reports `pending` after CONFIRMATION_TIMEOUT_MS. */
  waitForConfirmation(paymentId: string, txHash: string): Promise<PaymentOutcome>;
  /** One status read for a payment that is still pending. */
  checkStatus(paymentId: string, txHash?: string): Promise<PaymentOutcome>;
  explorerUrl(txHash: string): string;
}

/** After this long without confirmation the result screen shows "Payment pending". */
export const CONFIRMATION_TIMEOUT_MS = 60_000;

/** Paiflow asks clients to poll after 2 s and back off; capped at 6 s so the receipt appears promptly. */
const POLL_DELAYS_MS = [2000, 2000, 3000, 4000, 5000, 6000];

/** What the Hima server returns for a checkout (server/src/services/checkoutService.ts CheckoutView). */
type PaymentView = {
  paymentId: string;
  quoteId?: string;
  /** `cancelled`: it never reached the network (for example an expired quote), so nothing was charged. */
  status: ConfirmationResult | 'cancelled';
  txHash?: string;
  ledger?: number;
  assetAmount: string;
  assetCode: string;
  failure?: { code: string; reason: string };
  split?: SplitLine[];
  autoSaved?: AutoSaved | null;
  verification?: { status: 'verified' | 'mismatch' | 'unavailable'; legs: { role: string; label: string; ok: boolean; assetAmount: string | null }[] };
};

const fromView = (v: PaymentView): PaymentOutcome => {
  const cancelled = v.status === 'cancelled';
  const merchant = v.verification?.legs.find((l) => l.role === 'merchant' && l.ok && l.assetAmount);
  return {
    status: v.status === 'cancelled' ? 'failed' : v.status,
    txHash: v.txHash,
    ledger: v.ledger,
    assetAmount: v.assetAmount,
    assetCode: v.assetCode,
    failureReason:
      v.status === 'failed' || cancelled
        ? (v.failure?.reason ?? (cancelled ? 'Cancelled before it was sent' : 'The network rejected the payment'))
        : undefined,
    ...(v.autoSaved ? { autoSaved: v.autoSaved } : {}),
    ...(merchant ? { merchantReceived: { label: merchant.label, assetAmount: merchant.assetAmount as string } } : {}),
    ...(v.verification ? { verification: v.verification.status } : {}),
  };
};

type Deps = {
  fetchImpl?: typeof fetch;
  ensureReady?: () => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

/** Real payments: the Hima server pays through the Paiflow deployment and reports the on-chain outcome. */
export function createPaiflowProcessor({ fetchImpl, ensureReady, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now }: Deps = {}): PaymentProcessor {
  const read = (paymentId: string, sessionGeneration: number) => apiFetch<PaymentView>(`/api/payments/${encodeURIComponent(paymentId)}`, { fetchImpl, ensureReady, sessionGeneration, timeoutMs: 15_000 });

  /** The submission got no usable answer: ask whether the server ever created the payment. */
  async function resolveUnanswered(paymentId: string, reasonIfMissing: string, sessionGeneration: number): Promise<PaymentOutcome> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return fromView(await read(paymentId, sessionGeneration));
      } catch (e) {
        if (e instanceof ApiError && ['BACKEND_UNAVAILABLE', 'SESSION_CHANGED'].includes(e.code)) return { status: 'pending' };
        // The server never created it, so nothing was signed or sent.
        if (e instanceof ApiError && e.kind === 'http' && e.status === 404) return { status: 'failed', failureReason: reasonIfMissing };
        if (attempt < 2) await sleep(1500);
      }
    }
    // Still no answer: the outcome is unknown, which is pending, never failed.
    return { status: 'pending' };
  }

  return {
    async quote(request) {
      const v = await apiFetch<PaymentView>('/api/checkout/quote', { method: 'POST', body: request, fetchImpl, ensureReady, timeoutMs: 15_000 });
      return { quoteId: v.quoteId ?? v.paymentId, split: v.split ?? [], autoSaved: v.autoSaved ?? null };
    },

    async submit(request, { quoteId } = {}) {
      const sessionGeneration = getApiSessionGeneration();
      try {
        // A quoted checkout pays exactly that quote; otherwise the server quotes and pays in one step.
        const body = quoteId ? { quoteId } : request;
        return fromView(await apiFetch<PaymentView>('/api/checkout/payments', { method: 'POST', body, fetchImpl, ensureReady, sessionGeneration, timeoutMs: 45_000 }));
      } catch (e) {
        // Readiness failed before this POST. A prior call with the same payment id
        // may already have reached the server; reconcile when connectivity returns.
        if (e instanceof ApiError && ['BACKEND_UNAVAILABLE', 'SESSION_CHANGED'].includes(e.code)) return { status: 'pending' };
        // The public demo's daily limit refuses the payment before anything is signed or sent.
        if (e instanceof ApiError && e.status === 429) return { status: 'failed', failureReason: e.message };
        const reason = e instanceof ApiError && e.kind === 'http' ? e.message : "Couldn't reach Hima's server";
        return resolveUnanswered(request.paymentId, reason, sessionGeneration);
      }
    },

    async waitForConfirmation(paymentId) {
      const sessionGeneration = getApiSessionGeneration();
      const started = now();
      let latest: PaymentOutcome = { status: 'pending' };
      for (let i = 0; now() - started < CONFIRMATION_TIMEOUT_MS; i++) {
        await sleep(POLL_DELAYS_MS[Math.min(i, POLL_DELAYS_MS.length - 1)]);
        try {
          latest = fromView(await read(paymentId, sessionGeneration));
          if (latest.status !== 'pending') return latest;
        } catch (e) {
          if (e instanceof ApiError && ['BACKEND_UNAVAILABLE', 'SESSION_CHANGED'].includes(e.code)) break;
          // Unreachable or not found for now: keep following until the timeout.
        }
      }
      return { ...latest, status: 'pending' };
    },

    async checkStatus(paymentId, txHash) {
      const sessionGeneration = getApiSessionGeneration();
      if (!txHash) return resolveUnanswered(paymentId, "The payment never reached Hima's server", sessionGeneration);
      try {
        return fromView(await read(paymentId, sessionGeneration));
      } catch {
        return { status: 'pending', txHash };
      }
    },

    explorerUrl: explorerTxUrl,
  };
}

/**
 * Simulated testnet for the web preview only (EXPO_PUBLIC_PAYMENTS=mock). It is never a
 * fallback for the real processor. Dev builds can force 14b/14c with
 * localStorage["hima.dev.payment"] = "pending" | "failed", or with setDevOutcome().
 */
let devOutcome: ConfirmationResult | null = null;
if (__DEV__ && Platform.OS === 'web') {
  const v = globalThis.localStorage?.getItem('hima.dev.payment');
  if (v === 'pending' || v === 'failed' || v === 'confirmed') devOutcome = v;
}

export function setDevOutcome(outcome: ConfirmationResult | null) {
  if (__DEV__) devOutcome = outcome;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomHex = (length: number) => Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const mockSettledLater = new Map<string, true>();
const mockQuotes = new Map<string, CheckoutQuote & { assetAmount: string }>();

/** The mock's 90/10 split at the ₱7.50 demo rate, rounded like Paiflow's Split. */
function mockQuote(request: PaymentRequest) {
  const centavos = Math.round(request.amount * 100);
  const stroops = toStroops(centavos, 750);
  const [merchantStroops, savingsStroops] = splitByPercents(stroops, [90, 10]);
  const [merchantCentavos, savingsCentavos] = splitByPercents(BigInt(centavos), [90, 10]);
  const quote = {
    quoteId: `mock-${request.paymentId}`,
    assetAmount: formatStroopsDecimal(stroops),
    split: [
      { role: 'merchant' as const, label: 'Campus Canteen', percent: 90, amount: Number(merchantCentavos) / 100, assetAmount: formatStroopsDecimal(merchantStroops) },
      { role: 'savings' as const, label: 'Your savings', percent: 10, amount: Number(savingsCentavos) / 100, assetAmount: formatStroopsDecimal(savingsStroops) },
    ],
    autoSaved: { amount: Number(savingsCentavos) / 100, assetAmount: formatStroopsDecimal(savingsStroops), verified: false },
  };
  mockQuotes.set(request.paymentId, quote);
  return quote;
}

export const mockProcessor: PaymentProcessor = {
  async quote(request) {
    const q = mockQuotes.get(request.paymentId) ?? mockQuote(request);
    return { quoteId: q.quoteId, split: q.split, autoSaved: q.autoSaved };
  },
  async submit(request) {
    await wait(1400);
    const quote = mockQuotes.get(request.paymentId) ?? mockQuote(request);
    return { status: 'pending', txHash: randomHex(64), assetAmount: quote.assetAmount, assetCode: 'XLM' };
  },
  async waitForConfirmation(paymentId, txHash) {
    const quote = mockQuotes.get(paymentId);
    const outcome = devOutcome ?? 'confirmed';
    if (outcome === 'pending') {
      await wait(6000);
      // A pending payment settles a little later; Check status finds it confirmed.
      mockSettledLater.set(paymentId, true);
      return { status: 'pending', txHash, assetAmount: quote?.assetAmount, assetCode: 'XLM' };
    }
    await wait(4500);
    return outcome === 'failed' ? { status: 'failed', txHash, failureReason: 'Network timeout' } : mockConfirmed(paymentId, txHash);
  },
  async checkStatus(paymentId, txHash) {
    await wait(1200);
    return mockSettledLater.has(paymentId) ? mockConfirmed(paymentId, txHash) : { status: 'pending', txHash, assetAmount: mockQuotes.get(paymentId)?.assetAmount, assetCode: 'XLM' };
  },
  explorerUrl: explorerTxUrl,
};

/** Simulated confirmation; the "verified" split is part of the simulation, like the hash. */
function mockConfirmed(paymentId: string, txHash: string | undefined): PaymentOutcome {
  const quote = mockQuotes.get(paymentId);
  const merchant = quote?.split.find((l) => l.role === 'merchant');
  return {
    status: 'confirmed',
    txHash,
    assetAmount: quote?.assetAmount,
    assetCode: 'XLM',
    ...(quote?.autoSaved ? { autoSaved: { ...quote.autoSaved, verified: true } } : {}),
    ...(merchant ? { merchantReceived: { label: merchant.label, assetAmount: merchant.assetAmount } } : {}),
    verification: 'verified',
  };
}

export const PAYMENTS_MODE: 'paiflow' | 'mock' = process.env.EXPO_PUBLIC_PAYMENTS === 'mock' ? 'mock' : 'paiflow';

export const paymentProcessor: PaymentProcessor = PAYMENTS_MODE === 'mock' ? mockProcessor : createPaiflowProcessor();

/** "94be…278d" for a Stellar hash, "0x7a3f…c91e" for a 0x-prefixed one. */
export function shortHash(hash: string): string {
  const prefix = hash.startsWith('0x') ? '0x' : '';
  const body = hash.slice(prefix.length);
  return body.length > 8 ? `${prefix}${body.slice(0, 4)}…${body.slice(-4)}` : hash;
}
