import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radius } from '@/theme';

import type { LucideIcon } from './icons';

type Props = {
  icon: LucideIcon;
  /** Required: icon-only buttons need a spoken name ("Back", "Show password"). */
  accessibilityLabel: string;
  onPress?: () => void;
  color?: string;
  iconSize?: number;
  strokeWidth?: number;
  /** White fill (Components board header); screens use the default transparent fill. */
  filled?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** 44 × 44 icon button with a 12 radius. */
export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  color = colors.navy,
  iconSize = 22,
  strokeWidth = 2,
  filled = false,
  disabled,
  style,
  testID,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={0}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        filled && styles.filled,
        pressed && styles.pressed,
        style,
      ]}>
      <Icon size={iconSize} color={color} strokeWidth={strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.minTouch,
    height: layout.minTouch,
    flexShrink: 0,
    borderRadius: radius[12],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.white,
  },
  pressed: {
    backgroundColor: colors.muted,
  },
});
