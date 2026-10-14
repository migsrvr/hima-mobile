import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { LucideIcon } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import { colors, font, radius, tones, type Tone } from '@/theme';

type Props = {
  label: string;
  tone: Extract<Tone, 'blueText' | 'safe' | 'yellow' | 'neutral' | 'danger'>;
  /** A dot (ready), a spinner (in progress), or an icon. Status is never color alone. */
  leading: 'dot' | 'spinner' | LucideIcon;
  iconStrokeWidth?: number;
  /** md: 13 text (NFC, processing, results). sm: 12 text (authorization sheet). */
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
};

/** Live status pill under the scanner, on processing and on results. Announced to screen readers. */
export function StatusPill({ label, tone, leading, iconStrokeWidth = 2.2, size = 'md', style }: Props) {
  const t = tones[tone];
  const sm = size === 'sm';
  const Icon = leading === 'dot' || leading === 'spinner' ? null : leading;
  return (
    <View
      style={[styles.pill, sm ? styles.pillSm : styles.pillMd, { backgroundColor: t.bg, gap: leading === 'dot' || leading === 'spinner' ? 8 : 6 }, sm && styles.gapSm, style]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={label}>
      {leading === 'dot' && <View style={[styles.dot, { backgroundColor: colors.deepSkyBlue }]} />}
      {leading === 'spinner' && <Spinner size={14} color={t.fg} strokeWidth={2.5} />}
      {Icon && <Icon size={sm ? 13 : 14} color={t.fg} strokeWidth={iconStrokeWidth} />}
      <Text style={[styles.label, sm ? styles.labelSm : styles.labelMd, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.full,
  },
  pillMd: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillSm: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  gapSm: {
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  label: {
    fontFamily: font.jakarta[700],
  },
  labelMd: {
    fontSize: 13,
  },
  labelSm: {
    fontSize: 12,
  },
});
