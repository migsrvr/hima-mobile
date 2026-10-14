import { StyleSheet, View } from 'react-native';

import { Check, TriangleAlert } from '@/components/ui/icons';
import { StatusText } from '@/components/ui/StatusText';
import { Text } from '@/components/ui/Text';
import type { DaySummary } from '@/services/budget/week';
import { colors, font, radius, tabular } from '@/theme';
import { WEEKDAY_SHORT } from '@/types/schedule';
import { formatClassHours } from '@/utils/date';
import { formatPeso } from '@/utils/money';

type Props = {
  days: DaySummary[];
  spentTotal: number;
  plannedTotal: number;
};

const peso = (n: number) => formatPeso(n, { compact: true });

function subline(d: DaySummary): string {
  if (d.timing === 'future') {
    const hours = d.kind === 'school' && d.classHours ? ` · ${formatClassHours(d.classHours)}` : '';
    return `${peso(d.planTotal)} planned${hours}`;
  }
  return `${peso(d.spentPlanned)} of ${peso(d.planTotal)}`;
}

/** 08 Schedule "Day by day": each day's plan and how it went. */
export function DayByDayCard({ days, spentTotal, plannedTotal }: Props) {
  return (
    <View style={styles.card} accessibilityLabel="This week, day by day">
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Day by day
        </Text>
        <Text style={styles.total}>{`${peso(spentTotal)} of ${peso(plannedTotal)} spent`}</Text>
      </View>
      {days.map((d) => {
        const today = d.timing === 'today';
        const school = d.kind === 'school';
        return (
          <View key={d.weekday} style={styles.row} accessible>
            <View style={[styles.tile, today ? styles.tileToday : school ? styles.tileSchool : styles.tileFree]}>
              <Text style={[styles.tileDay, today ? styles.onBlue : school ? styles.daySchool : styles.dayFree]}>
                {WEEKDAY_SHORT[d.weekday].toUpperCase()}
              </Text>
              <Text style={[styles.tileDate, today && styles.onBlue]}>{d.date.getDate()}</Text>
            </View>
            <View style={styles.texts}>
              <Text style={styles.kind}>{`${school ? 'School day' : 'Free day'}${today ? ' · today' : ''}`}</Text>
              <Text style={styles.sub}>{subline(d)}</Text>
            </View>
            {today ? (
              <Text style={styles.inProgress}>In progress</Text>
            ) : d.timing === 'past' ? (
              d.underPlan >= 0 ? (
                <StatusText icon={Check} strokeWidth={3} color={colors.safeText} iconSize={12} gap={3} textStyle={styles.status}>
                  {d.underPlan === 0 ? 'On plan' : `${peso(d.underPlan)} under`}
                </StatusText>
              ) : (
                <StatusText icon={TriangleAlert} color={colors.warningText} iconSize={12} gap={3} textStyle={styles.status}>
                  {`${peso(-d.underPlan)} over`}
                </StatusText>
              )
            ) : null}
          </View>
        );
      })}
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 8,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // Content-box in the design: 52 min-height plus the 1 px top border.
    minHeight: 53,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius[12],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSchool: {
    backgroundColor: colors.yellowTint,
  },
  tileFree: {
    backgroundColor: colors.background,
  },
  tileToday: {
    backgroundColor: colors.deepSkyBlue,
  },
  tileDay: {
    fontFamily: font.jakarta[700],
    fontSize: 10,
  },
  daySchool: {
    color: colors.warningText,
  },
  dayFree: {
    color: colors.textSecondary,
  },
  onBlue: {
    color: colors.white,
  },
  tileDate: {
    fontFamily: font.jakarta[800],
    fontSize: 15,
    lineHeight: 15,
    color: colors.textPrimary,
  },
  texts: {
    flex: 1,
  },
  kind: {
    fontFamily: font.jakarta[600],
    fontSize: 14,
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 1,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  inProgress: {
    fontFamily: font.inter[600],
    fontSize: 12,
    color: colors.blueText,
  },
  status: {
    fontFamily: font.inter[600],
    fontSize: 12,
  },
});
