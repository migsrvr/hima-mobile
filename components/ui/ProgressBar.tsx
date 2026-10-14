import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

type Props = {
  /** 0–1. Values outside the range are clamped. */
  value: number;
  color?: string;
  height?: 4 | 6 | 8;
  /** Screen-reader label, e.g. "Food budget used". Omit when the parent already describes the progress. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Rounded track with a rounded fill (Muted track, Sky Blue fill by default). */
export function ProgressBar({ value, color = colors.skyBlue, height = 8, accessibilityLabel, style }: Props) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const percent = Math.round(clamped * 100);
  return (
    <View
      style={[styles.track, { height }, style]}
      accessible={accessibilityLabel != null}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      importantForAccessibility={accessibilityLabel != null ? 'yes' : 'no-hide-descendants'}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
