import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconTile } from '@/components/ui/IconTile';
import { Check, CircleX, Clock } from '@/components/ui/icons';
import { StatusText } from '@/components/ui/StatusText';
import { Text } from '@/components/ui/Text';
import { colors, font } from '@/theme';
import type { Transaction, TransactionStatus } from '@/types/finance';
import { formatActivityTime, formatTimeOfDay } from '@/utils/date';
import { spokenPeso } from '@/utils/money';

import { categoryVisuals, merchantIcons } from './categoryVisuals';
import { MoneyDisplay } from './MoneyDisplay';

const STATUS = {
  confirmed: { icon: Check, strokeWidth: 3, color: colors.safeText, label: 'Confirmed' },
  pending: { icon: Clock, strokeWidth: 2.5, color: colors.textPrimary, label: 'Pending' },
  failed: { icon: CircleX, strokeWidth: 2.5, color: colors.dangerText, label: 'Failed · not charged' },
} as const satisfies Record<TransactionStatus, unknown>;

type Props = {
  transaction: Transaction;
  /** Reference time for "Today, 12:05 PM" labels. */
  now: Date;
  /** The last row in a list has no divider. */
  isLast?: boolean;
  /** Rows grouped under a day heading show only the time ("7:10 AM · Transport") and 10 vertical padding. */
  grouped?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Merchant, time · category, amount and status (icon + label + color). */
export function TransactionRow({ transaction: t, now, isLast, grouped, onPress, style }: Props) {
  const visuals = categoryVisuals[t.category];
  const status = STATUS[t.status];
  const when = grouped ? formatTimeOfDay(new Date(t.createdAt)) : formatActivityTime(new Date(t.createdAt), now);
  const meta = `${when} · ${visuals.label}`;
  const signed = t.direction === 'out' ? -t.amount : t.amount;
  const spoken = `${t.merchantName}, ${meta}, ${t.direction === 'out' ? '' : 'plus '}${spokenPeso(t.amount)}, ${status.label}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessible
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={spoken}
      style={[styles.row, grouped && styles.rowGrouped, !isLast && styles.divider, style]}>
      <IconTile icon={t.merchantIcon ? merchantIcons[t.merchantIcon] : visuals.icon} tone={visuals.tone} size={40} />
      <View style={styles.middle}>
        <Text style={styles.name}>{t.merchantName}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <View style={styles.right}>
        <MoneyDisplay
          amount={signed}
          tone={t.status === 'failed' ? 'struck' : t.direction === 'in' ? 'incoming' : 'default'}
        />
        <StatusText
          icon={status.icon}
          strokeWidth={status.strokeWidth}
          color={status.color}
          iconSize={12}
          gap={3}
          textStyle={styles.status}
          style={styles.statusRow}>
          {status.label}
        </StatusText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowGrouped: {
    paddingVertical: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: font.jakarta[600],
    fontSize: 15,
    color: colors.textPrimary,
  },
  meta: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
  },
  statusRow: {
    // The design's status is an inline-flex line inside a block, so the browser gives it a
    // 21 px line box (the parent font's strut): 2 margin + 1.5 above the text, 2.5 below.
    marginTop: 3.5,
    marginBottom: 2.5,
  },
  status: {
    fontFamily: font.inter[600],
    fontSize: 12,
  },
});
