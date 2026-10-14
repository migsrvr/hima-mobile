import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, font, radius, tabular } from '@/theme';
import type { BudgetCategory } from '@/types/finance';
import { formatPeso } from '@/utils/money';
import { wholePercents } from '@/utils/percent';

import { categoryVisuals } from './categoryVisuals';

/** Segment colors on 09 Insights "Where it went". */
const SEGMENT: Record<BudgetCategory, string> = {
  food: colors.deepSkyBlue,
  transport: colors.skyBlue,
  other: colors.textDisabled,
  school: colors.rocketYellow,
};

type Props = {
  spent: Record<BudgetCategory, number>;
  total: number;
};

/** 09 Insights "Where it went": spending split by category, largest first. */
export function CategorySplitCard({ spent, total }: Props) {
  const rows = (Object.keys(spent) as BudgetCategory[])
    .map((c) => ({ c, amount: spent[c] }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const percents = wholePercents(rows.map((r) => r.amount));
  const label = rows.map((r, i) => `${categoryVisuals[r.c].label} ${percents[i]} percent`).join(', ');

  return (
    <View style={styles.card} accessibilityLabel="Spending by category">
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Where it went
        </Text>
        <Text style={styles.total}>{`${formatPeso(total)} total`}</Text>
      </View>

      {rows.length > 0 && (
        <View style={styles.bar} accessible accessibilityRole="image" accessibilityLabel={label}>
          {rows.map((r, i) => (
            <View
              key={r.c}
              style={[
                styles.segment,
                { backgroundColor: SEGMENT[r.c] },
                i === 0 && styles.segFirst,
                i === rows.length - 1 ? styles.segLast : { width: `${percents[i]}%` },
              ]}
            />
          ))}
        </View>
      )}

      <View style={styles.legend}>
        {rows.map((r, i) => (
          <View key={r.c} style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: SEGMENT[r.c] }]} />
            <Text style={styles.name}>{categoryVisuals[r.c].label}</Text>
            <Text style={styles.percent}>{`${percents[i]}%`}</Text>
            <Text style={styles.amount}>{formatPeso(r.amount)}</Text>
          </View>
        ))}
        {rows.length === 0 && <Text style={styles.empty}>No spending yet this period.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  total: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
    ...tabular,
  },
  bar: {
    flexDirection: 'row',
    gap: 3,
    height: 14,
    marginTop: 14,
  },
  segment: {
    height: '100%',
    borderRadius: radius[3],
  },
  segFirst: {
    borderTopLeftRadius: radius.full,
    borderBottomLeftRadius: radius.full,
  },
  segLast: {
    flex: 1,
    borderTopRightRadius: radius.full,
    borderBottomRightRadius: radius.full,
  },
  legend: {
    gap: 8,
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: radius[3],
  },
  name: {
    flex: 1,
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textPrimary,
    ...tabular,
  },
  percent: {
    width: 40,
    textAlign: 'right',
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
    ...tabular,
  },
  amount: {
    width: 72,
    textAlign: 'right',
    fontFamily: font.inter[600],
    fontSize: 14,
    color: colors.textPrimary,
    ...tabular,
  },
  empty: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
});
