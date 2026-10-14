import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, font } from '@/theme';

import { FieldBox, FieldFrame, webInputReset, type FieldTextSize } from './FieldFrame';
import { IconButton } from './IconButton';
import { Eye, EyeOff } from './icons';

/** `md` = Components board (15 text, 14 side padding), `lg` = 02 Log in (16 text, 16 side padding). */
const SIZES = {
  md: { fontSize: 15, paddingHorizontal: 14 },
  lg: { fontSize: 16, paddingHorizontal: 16 },
} as const;

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  size?: FieldTextSize;
  error?: string;
  helperText?: string;
  /** Masked password field. */
  password?: boolean;
  /** Show/hide button for password fields (02 Log in has it; the Components board example does not). */
  showToggle?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Labeled text field (email, password, plain text). 52 tall, 14 radius, 1.5 border. */
export const HimaInput = forwardRef<TextInput, Props>(function HimaInput(
  { label, size = 'md', error, helperText, password = false, showToggle = true, style, onFocus, onBlur, accessibilityHint, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const s = SIZES[size];
  const invalid = !!error;

  return (
    <FieldFrame label={label} textSize={size} error={error} helperText={helperText} style={style}>
      <FieldBox
        focused={focused}
        invalid={invalid}
        height={52}
        paddingHorizontal={s.paddingHorizontal}
        style={password && showToggle && styles.passwordBox}>
        <TextInput
          ref={ref}
          {...inputProps}
          secureTextEntry={password && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          accessibilityHint={[error, accessibilityHint].filter(Boolean).join('. ') || undefined}
          aria-invalid={invalid}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.skyBlue}
          cursorColor={colors.navy}
          underlineColorAndroid="transparent"
          style={[styles.input, webInputReset, { fontSize: s.fontSize }]}
        />
        {password && showToggle && (
          <View style={styles.toggle}>
            <IconButton
              icon={revealed ? EyeOff : Eye}
              accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
              onPress={() => setRevealed((r) => !r)}
              color={colors.textSecondary}
              iconSize={20}
            />
          </View>
        )}
      </FieldBox>
    </FieldFrame>
  );
});

const styles = StyleSheet.create({
  passwordBox: {
    // The design pads the text 52 from the right to clear the eye button (inside the border, as in CSS).
    paddingRight: 52,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontFamily: font.inter[400],
    color: colors.textPrimary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  toggle: {
    // Absolute insets are measured inside the 1.5 border; the design measures 4 from the outer edge.
    position: 'absolute',
    right: 4 - 1.5,
    top: 4 - 1.5,
  },
});
