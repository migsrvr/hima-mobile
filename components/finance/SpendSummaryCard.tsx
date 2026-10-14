import { StyleSheet, View } from 'react-native';

import { HimaBadge } from '@/components/ui/HimaBadge';
import { Check } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { colors, font, letterSpacing, lineHeight, radius, tabular } from '@/theme';
import { formatPeso, spokenPeso } from '@/utils/money';

type Props = {
  /** "Spent this week · Oct 12–18". */
  title: string;
  spent: number;
  planned: number;
  status: 'onTrack' | 'overPlan';
  /** "33% used · 5 days left · ₱10 under plan". */
  note: string;
};

/** 09 Insights top card: spent versus planned for the period. */
export function SpendSummaryCard({ title, spent, planned, status, note }: Props) {
  return (
    <View style={styles.card} accessibilityLabel={title}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount} accessibilityLabel={`${spokenPeso(spent)} of ${spokenPeso(planned)} planned`}>
        {`${formatPeso(spent)} `}
        <Text style={styles.amountNote}>{`of ${formatPeso(planned)} planned`}</Text>
      </Text>
      <ProgressBar value={planned > 0 ? spent / planned : 0} style={styles.bar} />
      <View style={styles.statusRow}>
        {status === 'onTrack' ? (
          <HimaBadge status="onTrack" icon={Check} strokeWidth={2.5} iconSize={13} dense />
        ) : (
          <HimaBadge status="overPlan" iconSize={13} dense />
        )}
        <Text style={styles.note}>{note}</Text>
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
  title: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  amount: {
    marginTop: 4,
    fontFamily: font.jakarta[800],
    fontSize: 32,
    lineHeight: lineHeight(32, 1.2),
    letterSpacing: letterSpacing(32, -0.01),
    color: colors.textPrimary,
    ...tabular,
  },
  amountNote: {
    // Inherits the amount's letter spacing (the design's span inherits -0.01em computed at 32 px),
    // but takes its own 1.2 line height like CSS's unitless line-height does.
    fontFamily: font.jakarta[600],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.2),
    color: colors.textSecondary,
  },
  bar: {
    marginTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  note: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
});
