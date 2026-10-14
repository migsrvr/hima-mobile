/**
 * Spacing, shape and elevation tokens from design/screens/Foundations.html.
 * Design px at 360 width map 1:1 to dp.
 */

/** Component spacing scale (Foundations): 4, 8, 12, 16, 20, 24, 32. */
export const space = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
} as const;

export const layout = {
  screenPadding: 20,
  cardPadding: 16,
  cardPaddingLarge: 20,
  sectionGap: 24,
  frameWidth: 360,
  buttonHeight: 52,
  payButtonHeight: 56,
  inputHeight: 52,
  minTouch: 44,
} as const;

/** Every corner radius used across design/screens. */
export const radius = {
  2: 2,
  3: 3,
  4: 4,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  14: 14, // input
  16: 16, // button
  18: 18,
  20: 20, // card
  24: 24,
  28: 28,
  full: 999, // chips, pills
} as const;

/**
 * Shadows as CSS box-shadow strings (supported by React Native's `boxShadow`
 * style on the new architecture), copied verbatim from the design files.
 */
export const shadow = {
  card: '0 1px 2px rgba(25, 53, 74, 0.06), 0 6px 16px rgba(25, 53, 74, 0.08)',
  cardSoft: '0 1px 2px rgba(25, 53, 74, 0.04), 0 8px 20px rgba(25, 53, 74, 0.06)',
  raised: '0 1px 3px rgba(25, 53, 74, 0.12)',
  thumb: '0 1px 2px rgba(25, 53, 74, 0.2)',
  focusRing: '0 0 0 4px rgba(57, 169, 232, 0.18)',
  payButton: '0 6px 16px rgba(209, 138, 22, 0.25)',
  sheet: '0 -8px 32px rgba(25, 53, 74, 0.18)',
  hero: '0 10px 24px rgba(22, 120, 181, 0.22)',
  blueButton: '0 6px 14px rgba(22, 120, 181, 0.25)',
  nfcIcon: '0 8px 20px rgba(22, 120, 181, 0.16)',
  safeIcon: '0 8px 20px rgba(24, 133, 110, 0.16)',
  nfcActive: '0 0 0 8px rgba(57, 169, 232, 0.22), 0 10px 24px rgba(22, 120, 181, 0.30)',
  tabBarHalo: '0 0 0 6px #FFFFFF, 0 0 0 7px #DFE9F0',
  aiAvatarRing: '0 0 0 2px #FFFFFF, 0 0 0 4px #DCD3F2',
} as const;
