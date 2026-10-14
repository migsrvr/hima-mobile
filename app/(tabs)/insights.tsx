import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AISuggestionCard } from '@/components/ai/AISuggestionCard';
import { CategorySplitCard } from '@/components/finance/CategorySplitCard';
import { SpendSummaryCard } from '@/components/finance/SpendSummaryCard';
import { TransactionsCard } from '@/components/finance/TransactionsCard';
import { WeeklyTrendChart, type TrendBar } from '@/components/finance/WeeklyTrendChart';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useBudget } from '@/hooks/useBudget';
import { insightSuggestions } from '@/services/ai';
import { weeklyAllowance } from '@/services/budget/plan';
import { toCents, toPesos } from '@/services/budget/safeToSpend';
import { previousWeeks } from '@/services/history';
import { useSettingsStore } from '@/stores/settings';
import { colors, font, layout, radius } from '@/theme';
import type { BudgetCategory } from '@/types/finance';
import { formatDateRange, formatMonthDay } from '@/utils/date';
import { formatPeso } from '@/utils/money';

type Period = 'week' | 'month';
const PERIODS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const peso = (n: number) => formatPeso(n, { compact: true });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** 09 Insights. */
export default function InsightsScreen() {
  const budget = useBudget();
  const aiOn = useSettingsStore((s) => s.aiSuggestions);
  const [period, setPeriod] = useState<Period>('week');
  const [suggestion, setSuggestion] = useState(0);
  if (!budget) return <Screen edges={['top']}>{null}</Screen>;

  const { plan, summary, now, transactions } = budget;
  const suggestions = insightSuggestions(budget);
  const current = suggestions[suggestion % suggestions.length];

  // Week figures come straight from the week summary; the month view (not in the design)
  // totals this calendar month's payments against the weekly plan scaled to the month.
  let title: string;
  let spent: number;
  let planned: number;
  let byCategory: Record<BudgetCategory, number>;
  let note: string;
  if (period === 'week') {
    title = `Spent this week · ${formatDateRange(summary.start, summary.end)}`;
    spent = summary.spentTotal;
    planned = summary.plannedTotal;
    byCategory = summary.spentByCategory;
    const pct = planned > 0 ? Math.round((spent / planned) * 100) : 0;
    const under = summary.underPlan;
    const status = under === 0 ? 'right on plan' : `${peso(Math.abs(under))} ${under > 0 ? 'under' : 'over'} plan`;
    note = `${pct}% used · ${plural(summary.daysLeft, 'day')} left · ${status}`;
  } else {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysInMonth = Math.round((monthEnd.getTime() - monthStart.getTime()) / 86_400_000);
    const charges = transactions.filter((t) => {
      const at = new Date(t.createdAt);
      return t.direction === 'out' && t.status !== 'failed' && at >= monthStart && at < monthEnd;
    });
    byCategory = { food: 0, transport: 0, school: 0, other: 0 };
    for (const t of charges) byCategory[t.category] = toPesos(toCents(byCategory[t.category]) + toCents(t.amount));
    spent = toPesos(charges.reduce((s, t) => s + toCents(t.amount), 0));
    planned = Math.round((summary.plannedTotal * daysInMonth) / 7);
    title = `Spent this month · ${MONTHS[now.getMonth()]}`;
    const pct = planned > 0 ? Math.round((spent / planned) * 100) : 0;
    note = `${pct}% used · ${plural(daysInMonth - now.getDate() + 1, 'day')} left`;
  }

  const limit = toPesos(toCents(weeklyAllowance(plan.inputs.allowance, plan.inputs.period)) - toCents(summary.protected));
  const bars: TrendBar[] = [
    ...previousWeeks(plan, now).map((w) => ({ label: formatMonthDay(w.weekStart), amount: w.amount })),
    { label: 'This wk', amount: summary.spentTotal, current: true },
  ];

  return (
    <Screen edges={['top']} contentStyle={styles.main}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Insights
        </Text>
        <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} size="sm" accessibilityLabel="Period" />
      </View>

      <SpendSummaryCard
        title={title}
        spent={spent}
        planned={planned}
        status={period === 'week' ? summary.status : spent <= planned ? 'onTrack' : 'overPlan'}
        note={note}
      />

      {period === 'week' && (
        <View style={styles.card} accessibilityLabel="Weekly spending trend">
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              Weekly spending
            </Text>
            <Text style={styles.cardMeta}>{`Last ${bars.length} weeks`}</Text>
          </View>
          <WeeklyTrendChart bars={bars} limit={limit} />
        </View>
      )}

      <CategorySplitCard spent={byCategory} total={spent} />

      {aiOn && current && (
        <AISuggestionCard
          title={current.title}
          body={current.body}
          index={(suggestion % suggestions.length) + 1}
          count={suggestions.length}
          onReview={() => router.push({ pathname: '/assistant', params: { ask: current.question } })}
          onNext={() => setSuggestion(suggestion + 1)}
        />
      )}

      <TransactionsCard transactions={transactions} now={now} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: {
    gap: 16,
    paddingTop: 28,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 28,
    color: colors.textPrimary,
  },
  card: {
    padding: 16,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  cardMeta: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
});
