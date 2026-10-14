import { Platform } from 'react-native';

/**
 * The app's single source of "now". Budget periods, relative times and payment
 * timestamps all read from here so tests and design comparisons can pin the time.
 *
 * Dev builds only: a fixed time can be set with clock.setFixed(), or on the web
 * preview through localStorage["hima.dev.now"] (an ISO timestamp).
 */
let fixed: number | null = null;

if (__DEV__ && Platform.OS === 'web') {
  const raw = globalThis.localStorage?.getItem('hima.dev.now');
  const parsed = raw ? Date.parse(raw) : NaN;
  if (!Number.isNaN(parsed)) fixed = parsed;
}

export const clock = {
  now(): Date {
    return new Date(fixed ?? Date.now());
  },
  /** Dev and tests only. Pass null to follow the real clock again. */
  setFixed(date: Date | null) {
    if (!__DEV__) return;
    fixed = date ? date.getTime() : null;
  },
};
