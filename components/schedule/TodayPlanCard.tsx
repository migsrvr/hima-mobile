import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { ChevronRight, GraduationCap, ShoppingBag } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { colors, font, lineHeight, radius, tabular } from '@/theme';
import type { ClassHours } from '@/types/schedule';
import { formatClassHours, formatWeekdayDayMonth } from '@/utils/date';
import { formatPeso } from '@/utils/money';

export type PlanCell = { label: string; left: number; plan: number };

type Props = {
  kind: 'school' | 'free';
  classHours?: ClassHours;
  /** Plan left per category for today ("Food plan left ₱150 of ₱150"). */
  cells: PlanCell[];
  nextSchoolDay: { date: Date; budget: number } | null;
  onOpenSchedule: () => void;
};

const peso = (n: number) => formatPeso(n, { compact: true });

/** 07 Home "Today's plan": what kind of day it is, what's left, and the next school day. */
export function TodayPlanCard({ kind, classHours, cells, nextSchoolDay, onOpenSchedule }: Props) {
  const school = kind === 'school';
  return (
    <View style={styles.card} accessibilityLabel="Today's plan">
      <View style={styles.head}>
        <IconTile
          icon={school ? GraduationCap : ShoppingBag}
          tone={school ? 'yellow' : 'muted'}
          size={44}
          iconSize={22}
        />
        <View style={styles.titles}>
          <Text style={styles.title} accessibilityRole="header">
            {school ? 'Today is a school day' : 'Today is a free day'}
          </Text>
          <Text style={styles.sub}>
            {school && classHours ? `Classes ${formatClassHours(classHours)}` : school ? 'Class hours not set' : 'No classes today'}
          </Text>
        </View>
        <IconButton
          icon={ChevronRight}
          accessibilityLabel="Open schedule"
          onPress={onOpenSchedule}
          color={colors.textSecondary}
          iconSize={20}
        />
      </View>

      <View style={styles.cells}>
        {cells.map((c) => (
          <View key={c.label} style={styles.cell}>
            <Text style={styles.cellLabel}>{c.label}</Text>
            <Text style={styles.cellValue}>{`${peso(c.left)} of ${peso(c.plan)}`}</Text>
          </View>
        ))}
      </View>

      {nextSchoolDay && (
        <Text style={styles.next}>
          {'Next school day: '}
          <Text style={styles.nextStrong}>{formatWeekdayDayMonth(nextSchoolDay.date)}</Text>
          {` · ${peso(nextSchoolDay.budget)} planned`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius[20],
    padding: 16,
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  cells: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flexBasis: '50%',
    flexShrink: 1,
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius[14],
    backgroundColor: colors.background,
  },
  cellLabel: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  cellValue: {
    marginTop: 2,
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
    ...tabular,
  },
  next: {
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
    color: colors.textPrimary,
  },
  nextStrong: {
    fontFamily: font.inter[600],
  },
});
