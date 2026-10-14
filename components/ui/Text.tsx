import { forwardRef } from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { colors, font } from '@/theme';

/**
 * Base text for every screen. Defaults to Inter Regular in Primary Text.
 * `includeFontPadding: false` makes Android lay text out by the font's ascent and
 * descent, which matches how the browser sizes the same text in the design files.
 */
export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...rest }, ref) {
  return <RNText ref={ref} style={[styles.base, style]} {...rest} />;
});

const styles = StyleSheet.create({
  base: {
    fontFamily: font.inter[400],
    color: colors.textPrimary,
    includeFontPadding: false,
  },
});
