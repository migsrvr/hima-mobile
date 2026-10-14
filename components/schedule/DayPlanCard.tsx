import { StyleSheet, View } from 'react-native';

import { categoryVisuals } from '@/components/finance/categoryVisuals';
import { HimaBadge } from '@/components/ui/HimaBadge';
import { IconTile } from '@/components/ui/IconTile';
import { Check, GraduationCap, ShoppingBag } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import type { DailyCategory, DaySummary } from '@/services/budget/week';
import { spendingStatus } from '@/services/budget/spending';
import { colors, font, letterSpacing, radius, tabular } from '@/theme';
import { formatClassHours, formatTimeOfDay, formatWeekdayDayShortMonth } from '@/utils/date';
import { formatPeso, spokenPeso } from '@/utils/money';

type Props = {
  day: DaySummary;
};

const peso = (n: number) => formatPeso(n, { compact: true });
const FILL = { onTrack: colors.skyBlue, nearLimit: colors.warning, over: colors.danger } as const;

/** What a category row says about the day's spending ("₱40 Campus Shuttle, 7:10 AM"). */
function detailFor(day: DaySummary, c: DailyCategory): string {
  const charges = day.charges.filter((t) => t.category === c);
  if (charges.length === 0) return day.timing === 'future' ? 'Planned' : 'Nothing spent yet';
  const last = charges[charges.length - 1];
  if (charges.length === 1) return `${peso(last.amount)} ${last.merchantName}, ${formatTimeOfDay(new Date(last.createdAt))}`;
  return `${peso(day.spent[c])} · ${charges.length} payments, last ${formatTimeOfDay(new Date(last.createdAt))}`;
}

/** 08 Schedule card for the selected day: what's left, status, and each planned category. */
export function DayPlanCard({ day }: Props) {
  const school = day.kind === 'school';
  const left = day.planTotal - day.spentPlanned;
  const status = spendingStatus(day.spentPlanned, day.planTotal);
  const categories: DailyCategory[] = (['food', 'transport', 'other'] as const).filter((c) => day.plan[c] > 0);
  const when = day.timing === 'today' ? 'Today · ' : '';
  const sub = school
    ? day.classHours
      ? `${when}${when ? 'classes' : 'Classes'} ${formatClassHours(day.classHours)}`
      : `${when}Class hours not set`
    : `${when}${when ? 'no classes' : 'No classes'}`;

  return (
    <View style={styles.card} accessibilityLabel={`${formatWeekdayDayShortMonth(day.date)} plan`}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          {formatWeekdayDayShortMonth(day.date)}
        </Text>
        {school ? (
          <HimaBadge status="schoolDay" icon={GraduationCap} iconSize={13} dense />
        ) : (
          <HimaBadge status="pending" label="Free day" icon={ShoppingBag} iconSize={13} dense />
        )}
      </View>
      <Text style={styles.sub}>{sub}</Text>

      <View style={styles.amountRow}>
        <Text
          style={styles.amount}
          accessibilityLabel={left >= 0 ? `${spokenPeso(left)} left of ${spokenPeso(day.planTotal)}` : `${spokenPeso(-left)} over plan`}>
          {left >= 0 ? `${peso(left)} ` : `${peso(-left)} `}
          <Text style={styles.amountNote}>{left >= 0 ? `left of ${peso(day.planTotal)}` : `over ${peso(day.planTotal)}`}</Text>
        </Text>
        {day.timing !== 'future' &&
          (status === 'over' ? (
            <HimaBadge status="overPlan" iconSize={13} dense />
          ) : (
            <HimaBadge status="onTrack" icon={Check} strokeWidth={2.5} iconSize={13} dense />
          ))}
      </View>
      <ProgressBar
        value={day.planTotal > 0 ? day.spentPlanned / day.planTotal : 0}
        color={FILL[status]}
        style={styles.bar}
      />

      <View style={styles.rows}>
        {categories.map((c) => {
          const v = categoryVisuals[c];
          const catLeft = day.plan[c] - day.spent[c];
          return (
            <View key={c} style={styles.row} accessible>
              <IconTile icon={v.icon} tone={v.tone} size={32} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{v.label}</Text>
                <Text style={styles.rowDetail}>{detailFor(day, c)}</Text>
              </View>
              <Text style={styles.rowValue}>{catLeft >= 0 ? `${peso(catLeft)} left` : `${peso(-catLeft)} over`}</Text>
            </View>
          );
        })}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontFamily: font.jakarta[700],
    fontSize: 18,
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 4,
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
  },
  amount: {
    flexShrink: 1,
    fontFamily: font.jakarta[800],
    fontSize: 26,
    letterSpacing: letterSpacing(26, -0.01),
    color: colors.textPrimary,
    ...tabular,
  },
  amountNote: {
    // Inherits the amount's letter spacing (the design's span inherits -0.01em computed at 26 px).
    fontFamily: font.jakarta[600],
    fontSize: 15,
    color: colors.textSecondary,
  },
  bar: {
    marginTop: 10,
  },
  rows: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // Content-box in the design: 52 min-height plus the 1 px top border.
    minHeight: 53,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: font.jakarta[600],
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowDetail: {
    marginTop: 1,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowValue: {
    fontFamily: font.jakarta[700],
    fontSize: 14,
    color: colors.textPrimary,
    ...tabular,
  },
});
