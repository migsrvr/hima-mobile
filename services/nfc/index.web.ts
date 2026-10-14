import { DEMO_TAG_REGISTRY } from '@/services/payments/merchants';

import type { NfcAvailability, NfcService, TagRead } from './types';

export type { NfcAvailability, RawTag, TagMeaning, TagRead } from './types';
export { classifyTag } from './classify';

/**
 * Web preview stand-in (browsers have no NFC). In dev it simulates a tap of the
 * registered demo tag; localStorage["hima.dev.nfc"] can force another outcome:
 * "unknown" | "unsupported" | "timeout" | "disabled".
 */
const forced = (): string | null => (__DEV__ ? (globalThis.localStorage?.getItem('hima.dev.nfc') ?? null) : null);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const nfc: NfcService = {
  async availability(): Promise<NfcAvailability> {
    if (!__DEV__) return 'unsupportedDevice';
    return forced() === 'disabled' ? 'disabled' : 'ready';
  },

  async readTag(timeoutMs): Promise<TagRead> {
    const mode = forced();
    if (mode === 'timeout') {
      await wait(Math.min(timeoutMs, 2500));
      return 'timeout';
    }
    await wait(1500);
    if (mode === 'unknown') return { id: '049A3B7C91C0', techTypes: ['android.nfc.tech.NfcA', 'android.nfc.tech.MifareClassic'] };
    if (mode === 'unsupported') return { id: '08F1E2D3C4B5', techTypes: ['android.nfc.tech.IsoDep', 'android.nfc.tech.NfcA'] };
    const demoUid = Object.keys(DEMO_TAG_REGISTRY)[0];
    return { id: demoUid, techTypes: ['android.nfc.tech.NfcA', 'android.nfc.tech.MifareClassic'] };
  },

  async cancel() {},
  async openSettings() {},
};
