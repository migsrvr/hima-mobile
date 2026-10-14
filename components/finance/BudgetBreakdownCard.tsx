import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconTile } from '@/components/ui/IconTile';
import type { LucideIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { colors, font, radius, tabular, type Tone } from '@/theme';
import { formatPeso, spokenPeso } from '@/utils/money';

export type BreakdownRow = {
  key: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  /** How the number was worked out ("₱150 × 3 school days", "Protected"). */
  detail: string;
  amount: number;
};

type Props = {
  title: string;
  rows: BreakdownRow[];
  style?: StyleProp<ViewStyle>;
};

/** 06 Budget "Where the numbers come from": one row per plan line with its source. */
export function BudgetBreakdownCard({ title, rows, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {rows.map((r) => (
        <View
          key={r.key}
          style={styles.row}
          accessible
          accessibilityLabel={`${r.title}, ${r.detail}, ${spokenPeso(r.amount)}`}>
          <IconTile icon={r.icon} tone={r.tone} size={30} />
          <View style={styles.texts}>
            <Text style={styles.rowTitle}>{r.title}</Text>
            <Text style={styles.detail}>{r.detail}</Text>
          </View>
          <Text style={styles.amount}>{formatPeso(r.amount)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginBottom: 8,
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // The design rows are content-box: 44 min-height plus the 1 px top border.
    minHeight: 45,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: font.jakarta[600],
    fontSize: 14,
    color: colors.textPrimary,
  },
  detail: {
    marginTop: 1,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  amount: {
    fontFamily: font.jakarta[700],
    fontSize: 14,
    color: colors.textPrimary,
    ...tabular,
  },
});
