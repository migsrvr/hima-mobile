import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import type { LucideIcon } from './icons';
import { Text } from './Text';

type Props = {
  icon: LucideIcon;
  color: string;
  iconSize: number;
  strokeWidth?: number;
  gap: number;
  textStyle: StyleProp<TextStyle>;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Inline icon + label in one color: input errors, progress warnings and
 * transaction statuses. Status is never color alone.
 */
export function StatusText({ icon: Icon, color, iconSize, strokeWidth = 2, gap, textStyle, children, style }: Props) {
  return (
    <View style={[styles.row, { gap }, style]}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon size={iconSize} color={color} strokeWidth={strokeWidth} />
      </View>
      <Text style={[textStyle, { color }, styles.text]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    flexShrink: 1,
  },
});
