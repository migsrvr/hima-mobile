import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, radius, tones, type Tone } from '@/theme';

import { Text } from './Text';

type Props = {
  label: string;
  tone: Tone;
  style?: StyleProp<ViewStyle>;
};

/** Small tinted label chip ("per school day", "per week", "per free day" on 05 Expenses). */
export function TintChip({ label, tone, style }: Props) {
  const t = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.full,
  },
  label: {
    fontFamily: font.inter[600],
    fontSize: 12,
  },
});
