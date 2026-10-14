import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, font, layout, radius } from '@/theme';
import type { BudgetCategory, Transaction } from '@/types/finance';
import { formatDayHeading, startOfDay } from '@/utils/date';

import { TransactionRow } from './TransactionRow';

type Filter = 'all' | BudgetCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'school', label: 'School' },
];

/** How many rows show before "See all". */
const PREVIEW = 4;

type Props = {
  transactions: Transaction[];
  now: Date;
};

/** 09 Insights "Transactions": category filter chips and rows grouped by day. */
export function TransactionsCard({ transactions, now }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState(false);

  const filtered = transactions
    .filter((t) => filter === 'all' || t.category === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const visible = expanded ? filtered : filtered.slice(0, PREVIEW);

  const groups: { key: string; heading: string; items: Transaction[] }[] = [];
  for (const t of visible) {
    const day = startOfDay(new Date(t.createdAt));
    const key = day.toISOString();
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(t);
    else groups.push({ key, heading: formatDayHeading(day, now), items: [t] });
  }

  return (
    <View style={styles.card} accessibilityLabel="Transactions">
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Transactions
        </Text>
        {filtered.length > PREVIEW && (
          <Pressable onPress={() => setExpanded(!expanded)} accessibilityRole="button" style={styles.link}>
            <Text style={styles.linkText}>{expanded ? 'Show less' : 'See all'}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Filter by category">
        {FILTERS.map((f) => {
          const on = f.value === filter;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              // 34 tall chips; extend the touch area to 44.
              hitSlop={{ top: 5, bottom: 5 }}
              style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
              <Text style={[styles.chipText, on ? styles.chipTextOn : styles.chipTextOff]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {groups.length === 0 && <Text style={styles.empty}>No transactions yet.</Text>}
      {groups.map((g, gi) => (
        <View key={g.key}>
          <Text style={[styles.heading, gi > 0 && styles.headingNext]}>{g.heading}</Text>
          {g.items.map((t, i) => (
            <TransactionRow key={t.id} transaction={t} now={now} grouped isLast={i === g.items.length - 1} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: layout.minTouch,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  link: {
    minHeight: layout.minTouch,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: font.jakarta[700],
    fontSize: 14,
    color: colors.deepSkyBlue,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
  },
  chip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipOn: {
    // Selected chips have no border in the design (so they are 2 dp narrower).
    borderWidth: 0,
    backgroundColor: colors.navy,
  },
  chipOff: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
  },
  chipTextOn: {
    fontFamily: font.jakarta[700],
    color: colors.white,
  },
  chipTextOff: {
    fontFamily: font.jakarta[600],
    color: colors.textPrimary,
  },
  heading: {
    marginTop: 6,
    fontFamily: font.inter[600],
    fontSize: 12,
    color: colors.textSecondary,
  },
  headingNext: {
    marginTop: 12,
  },
  empty: {
    paddingVertical: 12,
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
});
