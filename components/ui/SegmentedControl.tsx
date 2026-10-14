import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, radius, shadow } from '@/theme';

import { Text } from './Text';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Spoken name for the whole control ("Allowance period"). */
  accessibilityLabel?: string;
  /** md = full-width 44 tall (Log in, Allowance); sm = compact 38 tall, sized to its labels (Insights). */
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
};

/** Muted track with a white raised thumb on the selected option (Daily/Weekly, Log in/Sign up). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  size = 'md',
  style,
}: Props<T>) {
  const sm = size === 'sm';
  return (
    <View style={[styles.track, sm && styles.trackSm, style]} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={o.label}
            style={[styles.item, sm ? styles.itemSm : styles.itemMd, selected && styles.selected]}>
            <Text style={[styles.label, sm && styles.labelSm, selected ? styles.labelSelected : styles.labelIdle]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius[14],
    backgroundColor: colors.muted,
  },
  trackSm: {
    padding: 3,
    borderRadius: radius[12],
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMd: {
    flex: 1,
    height: 44,
    borderRadius: radius[11],
  },
  itemSm: {
    // Sized by the label (react-native-web reads flex: 0 as a zero basis, so no flex here).
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius[10],
  },
  selected: {
    backgroundColor: colors.white,
    boxShadow: shadow.raised,
  },
  label: {
    fontSize: 15,
  },
  labelSm: {
    fontSize: 14,
  },
  labelSelected: {
    fontFamily: font.jakarta[700],
    color: colors.textPrimary,
  },
  labelIdle: {
    fontFamily: font.jakarta[600],
    color: colors.textSecondary,
  },
});
