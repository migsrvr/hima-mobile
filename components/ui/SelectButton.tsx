import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, radius } from '@/theme';

import { ChevronDown } from './icons';
import { Text } from './Text';

type Props = {
  value: string;
  onPress: () => void;
  /** Spoken as "<label>, <value>". */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

/** Blue-tinted dropdown trigger ("Monday ▾" on 03 Allowance). Opens a picker sheet. */
export function SelectButton({ value, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}, ${value}`}
      accessibilityHint="Opens a list to choose from"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}>
      <Text style={styles.label}>{value}</Text>
      <ChevronDown size={16} color={colors.blueText} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius[12],
    backgroundColor: colors.backgroundSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: font.jakarta[700],
    fontSize: 14,
    color: colors.blueText,
  },
});
