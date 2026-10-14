import type { TextStyle } from 'react-native';

/**
 * Type tokens from design/screens/Foundations.html.
 * Plus Jakarta Sans: headings, labels, buttons, money. Inter: body, supporting text, metadata.
 *
 * Android cannot synthesize weights for custom fonts, so each weight is its own
 * family name (loaded in app/_layout.tsx). Use `font.jakarta[700]`, not fontWeight.
 */
export const font = {
  jakarta: {
    400: 'PlusJakartaSans_400Regular',
    500: 'PlusJakartaSans_500Medium',
    600: 'PlusJakartaSans_600SemiBold',
    700: 'PlusJakartaSans_700Bold',
    800: 'PlusJakartaSans_800ExtraBold',
  },
  inter: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
    700: 'Inter_700Bold',
  },
} as const;

/** Every font size used across design/screens (px at 360 width = dp). */
export const fontSize = {
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  26: 26,
  28: 28,
  30: 30,
  32: 32,
  36: 36,
  40: 40,
  44: 44,
  60: 60,
} as const;

/** CSS unitless line-height -> RN absolute line height. */
export const lineHeight = (size: number, multiplier: number) => size * multiplier;

/** CSS `letter-spacing: Xem` -> RN letterSpacing in dp. */
export const letterSpacing = (size: number, em: number) => size * em;

/** Money: tabular figures everywhere. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Named roles from the Foundations "Type" table. */
export const type = {
  hero: {
    fontFamily: font.jakarta[800],
    fontSize: 40,
    lineHeight: lineHeight(40, 1.1),
    letterSpacing: letterSpacing(40, -0.02),
    ...tabular,
  },
  pageHeading: { fontFamily: font.jakarta[700], fontSize: 28, lineHeight: lineHeight(28, 1.2) },
  sectionHeading: { fontFamily: font.jakarta[600], fontSize: 20, lineHeight: lineHeight(20, 1.3) },
  cardHeading: { fontFamily: font.jakarta[600], fontSize: 17, lineHeight: lineHeight(17, 1.3) },
  body: { fontFamily: font.inter[400], fontSize: 15, lineHeight: lineHeight(15, 1.5) },
  supporting: { fontFamily: font.inter[400], fontSize: 13, lineHeight: lineHeight(13, 1.5) },
  metadata: { fontFamily: font.inter[500], fontSize: 12 },
} satisfies Record<string, TextStyle>;
