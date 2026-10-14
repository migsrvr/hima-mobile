import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, radius, tones, type Tone } from '@/theme';

import {
  Ban,
  Check,
  CircleX,
  Clock,
  GraduationCap,
  Shield,
  Sparkle,
  TriangleAlert,
  type LucideIcon,
} from './icons';
import { Text } from './Text';

/** Statuses from the Components board. Each is icon + label + color, never color alone. */
const PRESETS = {
  confirmed: { tone: 'safe', icon: Check, strokeWidth: 2.5, label: 'Confirmed' },
  onTrack: { tone: 'safe', icon: Shield, strokeWidth: 2, label: 'On track' },
  pending: { tone: 'neutral', icon: Clock, strokeWidth: 2, label: 'Pending' },
  overPlan: { tone: 'yellow', icon: TriangleAlert, strokeWidth: 2, label: 'Over plan' },
  failed: { tone: 'danger', icon: CircleX, strokeWidth: 2, label: 'Failed' },
  notEnoughFunds: { tone: 'danger', icon: Ban, strokeWidth: 2, label: 'Not enough funds' },
  ai: { tone: 'aiText', icon: Sparkle, strokeWidth: 2, label: 'Hima AI' },
  schoolDay: { tone: 'yellow', icon: GraduationCap, strokeWidth: 2, label: 'School day' },
  synced: { tone: 'safe', icon: Check, strokeWidth: 2.5, label: 'Synced' },
} satisfies Record<string, { tone: Tone; icon: LucideIcon; strokeWidth: number; label: string }>;

export type BadgeStatus = keyof typeof PRESETS;

type Props = {
  status: BadgeStatus;
  /** Override the preset label (e.g. "On track" on the hero card uses the check icon). */
  label?: string;
  icon?: LucideIcon;
  strokeWidth?: number;
  /** 13 on the Schedule, Insights and Profile chips; 14 elsewhere. */
  iconSize?: number;
  /** 4 px vertical padding instead of 5 (chip inside the Safe-to-Spend hero). */
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function HimaBadge({ status, label, icon, strokeWidth, iconSize = 14, dense, style }: Props) {
  const p = PRESETS[status];
  const t = tones[p.tone];
  const Icon = icon ?? p.icon;
  const text = label ?? p.label;
  return (
    <View
      style={[styles.badge, { backgroundColor: t.bg }, dense && styles.dense, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}>
      <Icon size={iconSize} color={t.fg} strokeWidth={strokeWidth ?? p.strokeWidth} />
      <Text style={[styles.label, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: radius.full,
  },
  dense: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  label: {
    fontFamily: font.jakarta[700],
    fontSize: 12,
  },
});
