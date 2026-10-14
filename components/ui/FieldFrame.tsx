import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, font, radius, shadow } from '@/theme';

import { CircleAlert } from './icons';
import { StatusText } from './StatusText';
import { Text } from './Text';

export type FieldTextSize = 'md' | 'lg';

/**
 * Web preview only: browsers paint their own focus outline on <input>. The field box
 * already draws the design's focus ring, so the browser outline is removed.
 * (React Native's types have no "none" outline style, hence the cast.)
 */
export const webInputReset: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : {};

/** Label/error type sizes: `md` = Components board, `lg` = 02 Log in and onboarding. */
const TEXT = {
  md: { label: 13, error: 12, errorIcon: 14, errorGap: 4 },
  lg: { label: 14, error: 13, errorIcon: 15, errorGap: 6 },
} as const;

type FrameProps = {
  label?: string;
  /** Right side of the label row (e.g. the "per school day" chip on 05 Expenses). */
  labelAccessory?: ReactNode;
  textSize?: FieldTextSize;
  error?: string;
  helperText?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Label above, error or helper text below. Shared by HimaInput and MoneyInput. */
export function FieldFrame({ label, labelAccessory, textSize = 'md', error, helperText, children, style }: FrameProps) {
  const t = TEXT[textSize];
  return (
    <View style={style}>
      {label != null &&
        (labelAccessory ? (
          <View style={styles.labelRow}>
            <Text style={[styles.label, { fontSize: t.label }]} importantForAccessibility="no">
              {label}
            </Text>
            {labelAccessory}
          </View>
        ) : (
          <Text style={[styles.label, styles.labelAlone, { fontSize: t.label }]} importantForAccessibility="no">
            {label}
          </Text>
        ))}
      {children}
      {error ? (
        <StatusText
          icon={CircleAlert}
          color={colors.dangerText}
          iconSize={t.errorIcon}
          gap={t.errorGap}
          textStyle={[styles.error, { fontSize: t.error }]}
          style={styles.below}>
          {error}
        </StatusText>
      ) : helperText ? (
        <Text style={[styles.helper, styles.below]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

type BoxProps = {
  focused: boolean;
  invalid: boolean;
  height: number;
  borderRadius?: number;
  paddingHorizontal: number;
  gap?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** The bordered box: Border by default, Sky Blue + focus ring when focused, Danger when invalid. */
export function FieldBox({
  focused,
  invalid,
  height,
  borderRadius = radius[14],
  paddingHorizontal,
  gap,
  children,
  style,
}: BoxProps) {
  return (
    <View
      style={[
        styles.box,
        { height, borderRadius, paddingHorizontal, gap },
        focused && styles.focused,
        invalid && styles.invalid,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    fontFamily: font.jakarta[600],
    color: colors.textPrimary,
  },
  labelAlone: {
    marginBottom: 6,
  },
  below: {
    marginTop: 6,
  },
  error: {
    fontFamily: font.inter[500],
  },
  helper: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  focused: {
    borderColor: colors.skyBlue,
    boxShadow: shadow.focusRing,
  },
  invalid: {
    borderColor: colors.danger,
  },
});
