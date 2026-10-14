import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DayByDayCard } from '@/components/schedule/DayByDayCard';
import { DayPlanCard } from '@/components/schedule/DayPlanCard';
import { WeekStrip } from '@/components/schedule/WeekStrip';
import { HimaButton } from '@/components/ui/HimaButton';
import { IconButton } from '@/components/ui/IconButton';
import { ChevronLeft, ChevronRight, Pencil, Wallet } from '@/components/ui/icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useBudget } from '@/hooks/useBudget';
import { useEditPlan } from '@/hooks/useEditPlan';
import { addDays, nextAllowance, startOfWeek, summarizeWeek } from '@/services/budget/week';
import { colors, font, layout, radius, tabular } from '@/theme';
import { formatWeekRangeLong, formatWeekdayDayMonth } from '@/utils/date';
import { formatPeso, spokenPeso } from '@/utils/money';

const MAX_WEEKS_AHEAD = 4;

function weekLabel(offset: number): string {
  if (offset === 0) return 'This week';
  if (offset === 1) return 'Next week';
  if (offset === -1) return 'Last week';
  return offset > 0 ? `In ${offset} weeks` : `${-offset} weeks ago`;
}

/** 08 Schedule: the week's plan by day. */
export default function ScheduleScreen() {
  const budget = useBudget();
  const editPlan = useEditPlan();
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  if (!budget) return <Screen edges={['top']}>{null}</Screen>;

  const { plan, now, transactions, walletBalance } = budget;
  const week =
    offset === 0
      ? budget.summary
      : summarizeWeek({ plan, transactions, walletBalance, now, weekOf: addDays(now, offset * 7) });
  const todayIndex = week.days.findIndex((d) => d.timing === 'today');
  const selected = picked ?? (todayIndex >= 0 ? todayIndex : 0);
  // No history before the week the plan was confirmed.
  const firstWeek = startOfWeek(new Date(plan.confirmedAt), plan.weekStartsOn);
  const canGoBack = addDays(week.start, -7) >= firstWeek;
  const canGoForward = offset < MAX_WEEKS_AHEAD;
  const allowance = nextAllowance(plan, now);

  const go = (delta: number) => {
    setOffset(offset + delta);
    setPicked(null);
  };

  return (
    <Screen edges={['top']} contentStyle={styles.main}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Schedule
        </Text>
        <HimaButton
          label="Edit days"
          variant="secondary"
          size="md"
          icon={Pencil}
          fullWidth={false}
          onPress={() => editPlan('/school-days')}
          style={styles.edit}
        />
      </View>

      <View>
        <View style={styles.weekNav}>
          <IconButton
            icon={ChevronLeft}
            accessibilityLabel="Previous week"
            iconSize={20}
            onPress={() => go(-1)}
            disabled={!canGoBack}
            color={canGoBack ? colors.navy : colors.textDisabled}
          />
          <View style={styles.weekTitle} accessibilityRole="header">
            <Text style={styles.weekLabel}>{weekLabel(offset)}</Text>
            <Text style={styles.weekRange}>{formatWeekRangeLong(week.start, week.end)}</Text>
          </View>
          <IconButton
            icon={ChevronRight}
            accessibilityLabel="Next week"
            iconSize={20}
            onPress={() => go(1)}
            disabled={!canGoForward}
            color={canGoForward ? colors.navy : colors.textDisabled}
          />
        </View>
        <WeekStrip days={week.days} selected={selected} onSelect={setPicked} />
      </View>

      <DayPlanCard day={week.days[selected]} />

      <DayByDayCard days={week.days} spentTotal={week.spentTotal} plannedTotal={week.plannedTotal} />

      <View
        style={styles.allowance}
        accessible
        accessibilityLabel={`Next allowance ${formatWeekdayDayMonth(allowance.date)}, plus ${spokenPeso(allowance.amount)}`}>
        <Wallet size={20} color={colors.safeText} strokeWidth={2} />
        <Text style={styles.allowanceText}>{`Next allowance: ${formatWeekdayDayMonth(allowance.date)}`}</Text>
        <Text style={styles.allowanceAmount}>{formatPeso(allowance.amount, { sign: true })}</Text>
      </View>
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
  edit: {
    paddingHorizontal: 14,
    gap: 6,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekTitle: {
    alignItems: 'center',
  },
  weekLabel: {
    fontFamily: font.jakarta[700],
    fontSize: 15,
    color: colors.textPrimary,
  },
  weekRange: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  allowance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius[16],
    backgroundColor: colors.safeTint,
  },
  allowanceText: {
    flex: 1,
    fontFamily: font.jakarta[600],
    fontSize: 14,
    color: colors.safeText,
  },
  allowanceAmount: {
    fontFamily: font.jakarta[800],
    fontSize: 15,
    color: colors.safeText,
    ...tabular,
  },
});
