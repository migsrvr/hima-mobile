import type { Merchant } from '@/services/payments/merchants';

export type NfcAvailability = 'ready' | 'disabled' | 'unsupportedDevice';

/** A tag as the reader reports it. Hima only ever reads the UID and tech list. */
export type RawTag = { id: string; techTypes: string[] };

export type TagRead = RawTag | 'timeout' | 'cancelled';

/** What a read tag means for Tap to Pay (11c / 11d / 11e). */
export type TagMeaning =
  | { kind: 'merchant'; tagId: string; merchant: Merchant }
  | { kind: 'unknown'; tagId: string }
  | { kind: 'unsupported'; tagId: string };

export type NfcService = {
  availability(): Promise<NfcAvailability>;
  /** Waits for one tag, or resolves 'timeout' after `timeoutMs`. */
  readTag(timeoutMs: number): Promise<TagRead>;
  cancel(): Promise<void>;
  openSettings(): Promise<void>;
  /** True when taps are simulated (public demo without NFC hardware). Read after availability(). */
  simulated(): boolean;
};
