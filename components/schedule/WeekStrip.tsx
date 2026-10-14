import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { DaySummary } from '@/services/budget/week';
import { colors, font, radius, shadow } from '@/theme';
import { WEEKDAY_NAMES } from '@/types/schedule';

type Props = {
  days: DaySummary[];
  selected: number;
  onSelect: (index: number) => void;
};

/** Dot under each day: green = finished on plan, amber = finished over plan, yellow = today. */
function dotColor(d: DaySummary): string | undefined {
  if (d.timing === 'today') return colors.rocketYellow;
  if (d.timing === 'past') return d.underPlan >= 0 ? colors.safe : colors.warning;
  return undefined;
}

function spoken(d: DaySummary): string {
  const parts = [`${WEEKDAY_NAMES[d.weekday]} ${d.date.getDate()}`];
  if (d.timing === 'today') parts.push('today');
  parts.push(d.kind === 'school' ? 'school day' : 'free day');
  if (d.timing === 'past') parts.push(d.underPlan >= 0 ? 'on track' : 'over plan');
  return parts.join(', ');
}

/** 08 Schedule week: seven day buttons with school days in yellow and the selected day in blue. */
export function WeekStrip({ days, selected, onSelect }: Props) {
  const anyOver = days.some((d) => d.timing === 'past' && d.underPlan < 0);
  return (
    <View>
      <View style={styles.row}>
        {days.map((d, i) => {
          const on = i === selected;
          const school = d.kind === 'school';
          const dot = dotColor(d);
          return (
            <Pressable
              key={d.weekday}
              onPress={() => onSelect(i)}
              accessibilityRole="button"
              accessibilityLabel={spoken(d)}
              accessibilityState={{ selected: on }}
              // Days are ~41 dp wide at 360 dp; reach into the 6 dp gaps for a 44 dp target.
              hitSlop={{ left: 3, right: 3 }}
              style={[styles.day, on ? styles.dayOn : school ? styles.daySchool : styles.dayFree]}>
              <Text style={[styles.letter, on ? styles.textOn : school ? styles.letterSchool : styles.letterFree]}>
                {WEEKDAY_NAMES[d.weekday][0]}
              </Text>
              <Text style={[styles.date, on && styles.textOn]}>{d.date.getDate()}</Text>
              <View style={[styles.dot, dot != null && { backgroundColor: dot }]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.swatch} />
          <Text style={styles.legendText}>School day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.safe }]} />
          <Text style={styles.legendText}>Stayed on plan</Text>
        </View>
        {anyOver && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Over plan</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  day: {
    flex: 1,
    height: 72,
    borderRadius: radius[14],
    // Every day carries the 1 px border so all seven get the same width (as in the CSS grid).
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayOn: {
    backgroundColor: colors.deepSkyBlue,
    borderColor: colors.deepSkyBlue,
    boxShadow: shadow.blueButton,
  },
  daySchool: {
    backgroundColor: colors.yellowTint,
    borderColor: colors.yellowTint,
  },
  dayFree: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  letter: {
    fontFamily: font.jakarta[700],
    fontSize: 11,
  },
  letterSchool: {
    color: colors.warningText,
  },
  letterFree: {
    color: colors.textSecondary,
  },
  textOn: {
    color: colors.white,
  },
  date: {
    fontFamily: font.jakarta[800],
    fontSize: 17,
    color: colors.textPrimary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    // Content-box in the design: 10 plus the 1 px border on each side.
    width: 12,
    height: 12,
    borderRadius: radius[3],
    backgroundColor: colors.yellowTint,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  legendText: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
});
