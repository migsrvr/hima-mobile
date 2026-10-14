/**
 * Color tokens from design/screens/Foundations.html and design/README.md.
 * Screens and components read colors only from here.
 */
export const colors = {
  // Brand
  skyBlue: '#39A9E8', // accents, icons, progress, focus rings (never under white text)
  deepSkyBlue: '#1678B5', // filled buttons, links, hero card
  rocketYellow: '#FFC83D', // pay actions and brand moments only
  navy: '#19354A',
  white: '#FFFFFF',

  // Background and surface
  background: '#F5FAFE',
  backgroundSecondary: '#EAF5FC', // selected tabs, icon chips
  card: '#FFFFFF',
  muted: '#EDF2F6', // progress tracks, dividers
  border: '#DFE9F0',

  // Text
  textPrimary: '#19354A',
  textSecondary: '#5D7484',
  textDisabled: '#9AACB8',
  // Input placeholders. The design files show the browser default placeholder gray (4.6:1 on white).
  placeholder: '#757575',

  // Semantic
  safe: '#18856E',
  warning: '#D18A16', // never used for text (2.9:1)
  danger: '#CA4B52',
  ai: '#7359BF',

  // Text shades added for contrast (text on tints)
  blueText: '#10659A',
  safeText: '#11624F',
  warningText: '#8F5B00',
  dangerText: '#A8323A',
  aiText: '#5B44A8',

  // Tints
  safeTint: '#E6F4F0',
  yellowTint: '#FFF4D6',
  dangerTint: '#FBEAEB',
  aiTint: '#F3F0FB',

  // Tint borders (used on the screens alongside the tints)
  safeBorder: '#CDE9E1',
  yellowBorder: '#F3DFA8',
  dangerBorder: '#F2C7CA',
  aiBorder: '#E3DCF5',
  aiBorderStrong: '#DCD3F2',

  // Overlays and translucent fills
  scrim: 'rgba(25, 53, 74, 0.55)', // full-screen dim behind sheets/dialogs
  scrimPreview: 'rgba(25, 53, 74, 0.45)', // dim used on the Components board
  heroChip: 'rgba(9, 40, 64, 0.35)', // chip on the blue hero card
  heroOutline: 'rgba(255, 255, 255, 0.6)',
  heroDivider: 'rgba(255, 255, 255, 0.3)',
  splashFadeStart: 'rgba(245, 250, 254, 0)',
  splashFadeMid: 'rgba(245, 250, 254, 0.88)',

  // NFC scan rings (Sky Blue at fixed alphas)
  skyBlueA08: 'rgba(57, 169, 232, 0.08)',
  skyBlueA10: 'rgba(57, 169, 232, 0.10)',
  skyBlueA12: 'rgba(57, 169, 232, 0.12)',
  skyBlueA16: 'rgba(57, 169, 232, 0.16)',
  skyBlueA20: 'rgba(57, 169, 232, 0.20)',
  skyBlueA22: 'rgba(57, 169, 232, 0.22)',
  skyBlueA28: 'rgba(57, 169, 232, 0.28)',
  skyBlueA30: 'rgba(57, 169, 232, 0.30)',
  skyBlueA50: 'rgba(57, 169, 232, 0.50)',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Tint + foreground pairs used by icon tiles, chips and badges on the screens.
 * The foreground is always the contrast-safe text shade for that tint.
 */
export const tones = {
  blue: { bg: colors.backgroundSecondary, fg: colors.deepSkyBlue },
  blueText: { bg: colors.backgroundSecondary, fg: colors.blueText },
  yellow: { bg: colors.yellowTint, fg: colors.warningText },
  muted: { bg: colors.muted, fg: colors.textSecondary },
  neutral: { bg: colors.muted, fg: colors.textPrimary },
  safe: { bg: colors.safeTint, fg: colors.safeText },
  danger: { bg: colors.dangerTint, fg: colors.dangerText },
  ai: { bg: colors.aiTint, fg: colors.ai },
  aiText: { bg: colors.aiTint, fg: colors.aiText },
} as const;

export type Tone = keyof typeof tones;
