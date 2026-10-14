import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type AuthMethod = 'Fingerprint' | 'PIN';

/** Demo build's in-app payment PIN (STELLAR_PAIFLOW_IMPLEMENTATION.md). AuthorizeSheet checks it before calling onPin. */
export const DEMO_PIN = '1234';

export const isDemoPin = (pin: string) => pin === DEMO_PIN;

/**
 * Asks the student to authorize a payment. "Fingerprint" uses biometrics only.
 * "PIN" is the in-app 4-digit PIN, already checked by the sheet against DEMO_PIN.
 * The web preview has no biometrics, so dev builds approve after a short pause.
 */
export async function authorizePayment(method: AuthMethod, prompt: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (!__DEV__) return false;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }
  // The in-app PIN was compared with DEMO_PIN in AuthorizeSheet before this call.
  if (method === 'PIN') {
    return true;
  }
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
    if (!hasHardware || !enrolled) {
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
