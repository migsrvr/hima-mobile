import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, font, radius, shadow } from '@/theme';

import type { LucideIcon } from './icons';
import { Spinner } from './Spinner';
import { Text } from './Text';

export type ButtonVariant =
  | 'primary' // Deep Sky Blue: every regular action
  | 'pay' // Rocket Yellow: only starts or confirms a payment
  | 'secondary'
  | 'ai'
  | 'aiOutline'
  | 'text'
  | 'override'; // amber outline: "Pay anyway"

export type ButtonSize =
  | 'xl' // 56: Tap to Pay on Home, Use fingerprint
  | 'lg' // 52: standard
  | 'dialog' // 48: dialog actions
  | 'compact' // 48 with the 16 label: text buttons under payment screens
  | 'md'; // 44: card actions, empty state

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.deepSkyBlue, fg: colors.white },
  pay: { bg: colors.rocketYellow, fg: colors.navy },
  secondary: { bg: colors.white, fg: colors.navy, border: colors.border },
  ai: { bg: colors.ai, fg: colors.white },
  aiOutline: { bg: colors.white, fg: colors.aiText, border: colors.aiBorderStrong },
  text: { bg: 'transparent', fg: colors.deepSkyBlue },
  override: { bg: colors.white, fg: colors.warningText, border: colors.warning },
};

const DISABLED = { bg: colors.muted, fg: colors.textDisabled };

const SIZES: Record<ButtonSize, { height: number; radius: number; fontSize: number; gap: number; icon: number }> = {
  xl: { height: 56, radius: radius[16], fontSize: 17, gap: 10, icon: 22 },
  lg: { height: 52, radius: radius[16], fontSize: 16, gap: 8, icon: 20 },
  dialog: { height: 48, radius: radius[14], fontSize: 15, gap: 8, icon: 18 },
  compact: { height: 48, radius: radius[16], fontSize: 16, gap: 8, icon: 18 },
  md: { height: 44, radius: radius[14], fontSize: 14, gap: 8, icon: 16 },
};

type Props = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconSize?: number;
  iconStrokeWidth?: number;
  /** Icon before the label (default) or after it ("Open NFC settings ↗"). */
  iconPosition?: 'start' | 'end';
  disabled?: boolean;
  /** Shows the spinner and blocks presses. `label` should say what is happening ("Saving…"). */
  loading?: boolean;
  /** Pay-button glow (Tap to Pay on Home). */
  elevated?: boolean;
  /** Stretch to the parent's width (default). When false the button hugs its label with 18 side padding. */
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function HimaButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  iconSize,
  iconStrokeWidth = 2,
  iconPosition = 'start',
  disabled = false,
  loading = false,
  elevated = false,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: Props) {
  const v = disabled ? DISABLED : VARIANTS[variant];
  const s = SIZES[size];
  const border = disabled ? undefined : VARIANTS[variant].border;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          borderRadius: s.radius,
          backgroundColor: v.bg,
          gap: s.gap,
        },
        border != null && { borderWidth: 1.5, borderColor: border },
        fullWidth ? styles.full : styles.hug,
        elevated && !disabled && styles.elevated,
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <Spinner size={18} color={v.fg} strokeWidth={2.5} />
      ) : Icon && iconPosition === 'start' ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon size={iconSize ?? s.icon} color={v.fg} strokeWidth={iconStrokeWidth} />
        </View>
      ) : null}
      <Text style={[styles.label, { color: v.fg, fontSize: s.fontSize }]}>{label}</Text>
      {!loading && Icon && iconPosition === 'end' && (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon size={iconSize ?? s.icon} color={v.fg} strokeWidth={iconStrokeWidth} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: {
    alignSelf: 'stretch',
  },
  hug: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
  },
  elevated: {
    boxShadow: shadow.payButton,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: font.jakarta[700],
    textAlign: 'center',
  },
});
