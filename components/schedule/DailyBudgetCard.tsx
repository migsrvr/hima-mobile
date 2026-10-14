import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { colors, font, radius, tabular } from '@/theme';
import { formatPeso, spokenPeso } from '@/utils/money';

type Props = {
  /** "TODAY'S PLAN". */
  label: string;
  spent: number;
  planned: number;
  style?: StyleProp<ViewStyle>;
};

/** Outlined card: what's left of a day's plan, a thin bar, and "₱40 of ₱230 spent". */
export function DailyBudgetCard({ label, spent, planned, style }: Props) {
  const left = Math.max(0, planned - spent);
  const peso = (n: number) => formatPeso(n, { compact: true });
  return (
    <View
      style={[styles.card, style]}
      accessible
      accessibilityLabel={`${label}: ${spokenPeso(left)} left, ${spokenPeso(spent)} of ${spokenPeso(planned)} spent`}>
      <Text style={styles.kicker}>{label}</Text>
      <Text style={styles.value}>{`${peso(left)} left`}</Text>
      <ProgressBar value={planned > 0 ? spent / planned : 0} height={6} style={styles.bar} />
      <Text style={styles.caption}>{`${peso(spent)} of ${peso(planned)} spent`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: radius[16],
    borderWidth: 1,
    borderColor: colors.border,
  },
  kicker: {
    fontFamily: font.inter[600],
    fontSize: 12,
    color: colors.textSecondary,
  },
  value: {
    marginTop: 6,
    fontFamily: font.jakarta[800],
    fontSize: 22,
    color: colors.textPrimary,
    ...tabular,
  },
  bar: {
    marginTop: 8,
  },
  caption: {
    marginTop: 6,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
});
