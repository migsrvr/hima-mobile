import { forwardRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, font, letterSpacing, radius, tabular } from '@/theme';
import { formatAmountInput, sanitizeAmountInput } from '@/utils/money';

import { FieldBox, FieldFrame, webInputReset, type FieldTextSize } from './FieldFrame';
import { Text } from './Text';

/**
 * md   = Components board (16 figures)
 * lg   = 05 Expenses (17 figures)
 * hero = 03 Allowance (36 figures, 76 tall)
 */
const SIZES = {
  md: { height: 52, inputHeight: 48, radius: radius[14], padding: 14, gap: 6, symbol: 16, input: 16, inputFont: font.jakarta[700], spacing: 0 },
  lg: { height: 52, inputHeight: 48, radius: radius[14], padding: 14, gap: 6, symbol: 16, input: 17, inputFont: font.jakarta[700], spacing: 0 },
  hero: {
    height: 76,
    inputHeight: 60,
    radius: radius[20],
    padding: 20,
    gap: 8,
    symbol: 30,
    input: 36,
    inputFont: font.jakarta[800],
    spacing: letterSpacing(36, -0.02),
  },
} as const;

type Props = Omit<TextInputProps, 'style' | 'value' | 'onChangeText' | 'keyboardType'> & {
  label: string;
  /** Raw amount string ("3000.5"), as produced by onChangeValue. */
  value: string;
  onChangeValue: (raw: string) => void;
  size?: keyof typeof SIZES;
  labelSize?: FieldTextSize;
  labelAccessory?: ReactNode;
  /** Right-hand note inside the field ("per school day", "₱450 a week"). */
  suffix?: string;
  /** Show two decimals once the field loses focus ("3,000.00"). */
  padDecimalsOnBlur?: boolean;
  error?: string;
  helperText?: string;
  style?: StyleProp<ViewStyle>;
};

/** Peso field: ₱ prefix, tabular figures, numeric keyboard, no negatives. */
export const MoneyInput = forwardRef<TextInput, Props>(function MoneyInput(
  {
    label,
    value,
    onChangeValue,
    size = 'md',
    labelSize = 'md',
    labelAccessory,
    suffix,
    padDecimalsOnBlur = false,
    error,
    helperText,
    style,
    onFocus,
    onBlur,
    accessibilityHint,
    ...inputProps
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const s = SIZES[size];
  const display = formatAmountInput(value, { padDecimals: padDecimalsOnBlur && !focused });

  return (
    <FieldFrame
      label={label}
      labelAccessory={labelAccessory}
      textSize={labelSize}
      error={error}
      helperText={helperText}
      style={style}>
      <FieldBox
        focused={focused}
        invalid={!!error}
        height={s.height}
        borderRadius={s.radius}
        paddingHorizontal={s.padding}
        gap={s.gap}>
        <Text
          style={[styles.symbol, { fontSize: s.symbol }]}
          accessibilityElementsHidden
          importantForAccessibility="no">
          ₱
        </Text>
        <TextInput
          ref={ref}
          {...inputProps}
          value={display}
          onChangeText={(text) => onChangeValue(sanitizeAmountInput(text))}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          accessibilityLabel={`${label}, in pesos`}
          accessibilityHint={[error, suffix, accessibilityHint].filter(Boolean).join('. ') || undefined}
          aria-invalid={!!error}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.skyBlue}
          cursorColor={colors.navy}
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            webInputReset,
            {
              fontSize: s.input,
              fontFamily: s.inputFont,
              letterSpacing: s.spacing,
              height: s.inputHeight,
            },
          ]}
        />
        {suffix != null && (
          <Text style={styles.suffix} importantForAccessibility="no">
            {suffix}
          </Text>
        )}
      </FieldBox>
    </FieldFrame>
  );
});

const styles = StyleSheet.create({
  symbol: {
    fontFamily: font.jakarta[700],
    color: colors.textSecondary,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: colors.textPrimary,
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...tabular,
  },
  suffix: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
    ...tabular,
  },
});
