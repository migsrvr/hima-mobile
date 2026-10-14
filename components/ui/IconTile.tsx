import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tones, type Tone } from '@/theme';

import type { LucideIcon } from './icons';

/** Tile sizes used on the screens: [tile, corner radius, icon]. */
const SIZES = {
  30: { radius: 9, icon: 15 }, // 06 "Where the numbers come from"
  32: { radius: 10, icon: 16 }, // 07 budget rows
  40: { radius: 12, icon: 18 }, // transaction rows
  44: { radius: 14, icon: 20 }, // wallet card, dialog, today's plan
} as const;

type Props = {
  icon?: LucideIcon;
  tone?: Tone;
  /** 30/32/40/44 use the design's radius and icon size; other sizes need `radius` and `iconSize`. */
  size?: number;
  /** Overrides for the few tiles that differ from the defaults (e.g. 44 tile with a 22 icon). */
  radius?: number;
  iconSize?: number;
  strokeWidth?: number;
  /** Text content instead of an icon (e.g. "MON" day tiles). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Rounded square with a tinted background and a centered icon. Always decorative. */
export function IconTile({
  icon: Icon,
  tone = 'blue',
  size = 40,
  radius,
  iconSize,
  strokeWidth = 2,
  children,
  style,
}: Props) {
  const s = SIZES[size as keyof typeof SIZES] ?? { radius: size / 2, icon: Math.round(size / 2) };
  const t = tones[tone];
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius ?? s.radius, backgroundColor: t.bg },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {Icon ? <Icon size={iconSize ?? s.icon} color={t.fg} strokeWidth={strokeWidth} /> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
