import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, font, radius } from '@/theme';
import type { ClassHours } from '@/types/schedule';
import { formatClassHours, formatDayMonth, weekdayShort } from '@/utils/date';

type Props = {
  date: Date;
  classHours?: ClassHours;
  style?: StyleProp<ViewStyle>;
};

/** Yellow card for an upcoming school day: "FRI · SCHOOL DAY", "16 Oct", class hours. */
export function SchoolDayCard({ date, classHours, style }: Props) {
  return (
    <View style={[styles.card, style]} accessible>
      <Text style={styles.kicker}>{`${weekdayShort(date.getDay()).toUpperCase()} · SCHOOL DAY`}</Text>
      <Text style={styles.date}>{formatDayMonth(date)}</Text>
      {classHours && <Text style={styles.hours}>{formatClassHours(classHours)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: radius[16],
    backgroundColor: colors.yellowTint,
  },
  kicker: {
    fontFamily: font.inter[600],
    fontSize: 12,
    color: colors.warningText,
  },
  date: {
    marginTop: 6,
    fontFamily: font.jakarta[800],
    fontSize: 22,
    color: colors.textPrimary,
  },
  hours: {
    marginTop: 4,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textPrimary,
  },
});
