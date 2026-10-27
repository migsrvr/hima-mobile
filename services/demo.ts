/**
 * Public demo build (EXPO_PUBLIC_DEMO=1, set only for the hosted web app and the demo APK).
 * Without NFC hardware (browsers, emulators) Tap to Pay simulates a tap of the registered demo
 * student ID, and the web accepts the in-app demo PIN. Payments themselves are unchanged: they go
 * through the server and only show as successful once confirmed on the Stellar testnet.
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO === '1';
