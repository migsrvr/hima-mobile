import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, font, radius, tabular } from '@/theme';
import { WEEKDAY_SHORT, type Weekday } from '@/types/schedule';
import { formatPeso, spokenPeso } from '@/utils/money';

type Props = {
  kind: 'school' | 'free';
  /** Budget for one day of this kind. */
  amount: number;
  /** Days of this kind, in week order. */
  days: Weekday[];
  style?: StyleProp<ViewStyle>;
};

/** 06 Budget "Daily plan" card: yellow for school days, outlined for free days. */
export function DayTypeCard({ kind, amount, days, style }: Props) {
  const school = kind === 'school';
  const label = school ? 'School day' : 'Free day';
  const dayList = days.length > 0 ? days.map((d) => WEEKDAY_SHORT[d]).join(' · ') : 'None this week';
  return (
    <View
      style={[styles.card, school ? styles.school : styles.free, style]}
      accessible
      accessibilityLabel={`${label}: ${spokenPeso(amount)} a day. ${dayList}`}>
      <Text style={[styles.label, school ? styles.labelSchool : styles.labelFree]}>{label}</Text>
      <Text style={styles.amount}>{formatPeso(amount, { compact: true })}</Text>
      <Text style={styles.days}>{dayList}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius[16],
  },
  school: {
    backgroundColor: colors.yellowTint,
  },
  free: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontFamily: font.inter[600],
    fontSize: 12,
  },
  labelSchool: {
    color: colors.warningText,
  },
  labelFree: {
    color: colors.textSecondary,
  },
  amount: {
    marginTop: 2,
    fontFamily: font.jakarta[800],
    fontSize: 22,
    color: colors.textPrimary,
    ...tabular,
  },
  days: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textPrimary,
  },
});
