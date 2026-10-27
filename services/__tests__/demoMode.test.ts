// The public demo build (EXPO_PUBLIC_DEMO=1): simulated taps without NFC hardware, PIN-only on the web.
const load = <T,>(demo: boolean, path: string, os: 'web' | 'android' = 'android'): T => {
  let mod: T | undefined;
  jest.isolateModules(() => {
    process.env.EXPO_PUBLIC_DEMO = demo ? '1' : '';
    jest.doMock('react-native', () => ({ Platform: { OS: os } }));
    jest.doMock('expo-local-authentication', () => ({ hasHardwareAsync: jest.fn(async () => false) }));
    mod = require(path) as T;
  });
  return mod as T;
};

type Nfc = typeof import('../nfc/index').nfc;

const mockNfcManager = (supported: boolean, enabled = true) =>
  jest.doMock('react-native-nfc-manager', () => ({
    __esModule: true,
    default: {
      start: jest.fn(async () => {}),
      isSupported: jest.fn(async () => supported),
      isEnabled: jest.fn(async () => enabled),
      requestTechnology: jest.fn(),
      getTag: jest.fn(),
      cancelTechnologyRequest: jest.fn(async () => {}),
    },
    NfcTech: {},
  }));

describe('public demo mode', () => {
  const original = process.env.EXPO_PUBLIC_DEMO;
  afterEach(() => {
    process.env.EXPO_PUBLIC_DEMO = original;
    jest.dontMock('react-native-nfc-manager');
    jest.dontMock('react-native');
    jest.useRealTimers();
  });

  it('an emulator without NFC simulates a tap of the registered student ID in the demo build', async () => {
    mockNfcManager(false);
    const { nfc } = load<{ nfc: Nfc }>(true, '../nfc/index');
    expect(await nfc.availability()).toBe('ready');
    expect(nfc.simulated()).toBe(true);
    jest.useFakeTimers();
    const read = nfc.readTag(30_000);
    jest.advanceTimersByTime(1500);
    expect(await read).toMatchObject({ id: '22:E9:4A:7A' });
  });

  it('outside the demo build a device without NFC still reports unsupported', async () => {
    mockNfcManager(false);
    const { nfc } = load<{ nfc: Nfc }>(false, '../nfc/index');
    expect(await nfc.availability()).toBe('unsupportedDevice');
    expect(nfc.simulated()).toBe(false);
  });

  it('a phone with working NFC reads real tags even in the demo build', async () => {
    mockNfcManager(true, true);
    const { nfc } = load<{ nfc: Nfc }>(true, '../nfc/index');
    expect(await nfc.availability()).toBe('ready');
    expect(nfc.simulated()).toBe(false);
  });

  it('the web demo authorizes only with the in-app PIN, never a fingerprint (release build)', async () => {
    const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    const demo = load<typeof import('../biometric')>(true, '../biometric', 'web');
    expect(await demo.authorizePayment('PIN', 'Authorize')).toBe(true);
    expect(await demo.authorizePayment('Fingerprint', 'Authorize')).toBe(false);
    (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
  });
});
