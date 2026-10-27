import { DEMO_MODE } from '@/services/demo';

import type { NfcService, TagRead } from './types';

export type { NfcAvailability, RawTag, TagMeaning, TagRead } from './types';
export { classifyTag } from './classify';

let NfcManager: any = null;
let NfcTech: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('react-native-nfc-manager');
  NfcManager = mod.default ?? mod;
  NfcTech = mod.NfcTech;
} catch {
  // Running in Expo Go without native module
  NfcManager = null;
}

/** Expo Go has no native module; the public demo build also simulates taps on devices without NFC (emulators). */
let simulate = !NfcManager;
const SIMULATED_TAG = { id: '22:E9:4A:7A', techTypes: ['android.nfc.tech.NfcA', 'android.nfc.tech.MifareClassic'] };

let started = false;
async function start() {
  if (started || !NfcManager) return;
  try {
    await NfcManager.start();
    started = true;
  } catch {
    started = false;
  }
}

/** Android NFC reader with graceful Expo Go fallback. */
export const nfc: NfcService = {
  async availability() {
    if (!NfcManager) return 'ready'; // Expo Go demo fallback
    let availability: 'ready' | 'disabled' | 'unsupportedDevice';
    try {
      if (!(await NfcManager.isSupported())) availability = 'unsupportedDevice';
      else {
        await start();
        availability = (await NfcManager.isEnabled()) ? 'ready' : 'disabled';
      }
    } catch {
      availability = 'unsupportedDevice';
    }
    simulate = DEMO_MODE && availability !== 'ready';
    return simulate ? 'ready' : availability;
  },

  async readTag(timeoutMs) {
    // Expo Go, or the public demo on a device without NFC: simulate the registered student ID tag.
    if (simulate) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return SIMULATED_TAG;
    }

    await start();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<TagRead>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs);
    });

    const anyTech = NfcTech ? [
      NfcTech.NfcA,
      NfcTech.NfcB,
      NfcTech.NfcF,
      NfcTech.NfcV,
      NfcTech.IsoDep,
      NfcTech.MifareClassic,
      NfcTech.MifareUltralight,
      NfcTech.Ndef,
    ] : [];

    const read = (async (): Promise<TagRead> => {
      try {
        await NfcManager.requestTechnology(anyTech);
        const tag = await NfcManager.getTag();
        return tag?.id ? { id: tag.id, techTypes: tag.techTypes ?? [] } : 'cancelled';
      } catch {
        return 'cancelled';
      }
    })();
    try {
      return await Promise.race([read, timeout]);
    } finally {
      clearTimeout(timer);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  },

  // Only the public demo says so on screen; Expo Go keeps the designed copy.
  simulated: () => DEMO_MODE && simulate,

  async cancel() {
    if (NfcManager) {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  },

  async openSettings() {
    if (NfcManager) {
      await NfcManager.goToNfcSetting().catch(() => false);
    }
  },
};
