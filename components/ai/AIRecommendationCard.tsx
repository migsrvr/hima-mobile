import { StyleSheet, View } from 'react-native';

import { HimaButton } from '@/components/ui/HimaButton';
import { Check } from '@/components/ui/icons';
import { StatusText } from '@/components/ui/StatusText';
import { Text } from '@/components/ui/Text';
import { categoryLabel, type AISuggestion } from '@/services/ai';
import { colors, font, lineHeight, radius, tabular } from '@/theme';
import { formatPeso } from '@/utils/money';

type Props = {
  suggestion: AISuggestion;
  state: 'open' | 'approved' | 'dismissed';
  onApprove: () => void;
  onDismiss: () => void;
};

const peso = (n: number) => formatPeso(n, { compact: true });

/**
 * 10 Hima AI "Suggested change". The plan changes only when the student taps
 * Approve; the before → after figures come from the plan calculation.
 */
export function AIRecommendationCard({ suggestion, state, onApprove, onDismiss }: Props) {
  return (
    <View style={styles.card} accessibilityLabel="Suggested change">
      <View style={styles.tag}>
        <Text style={styles.tagText}>Suggested change</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {suggestion.title}
      </Text>
      <Text style={styles.reason}>{suggestion.reason}</Text>
      <View style={styles.changes}>
        {suggestion.changes.map((c) => (
          <View
            key={c.category}
            style={styles.change}
            accessible
            accessibilityLabel={`${categoryLabel(c.category)} from ${peso(c.from)} to ${peso(c.to)} a week`}>
            <Text style={styles.changeText}>
              {`${categoryLabel(c.category)} `}
              <Text style={styles.changeStrong}>{`${peso(c.from)} → ${peso(c.to)}`}</Text>
            </Text>
          </View>
        ))}
      </View>
      {state === 'open' ? (
        <View style={styles.actions}>
          <HimaButton label="Approve" variant="ai" size="md" onPress={onApprove} style={styles.action} />
          <HimaButton label="Not now" variant="aiOutline" size="md" onPress={onDismiss} style={styles.action} />
        </View>
      ) : state === 'approved' ? (
        <StatusText icon={Check} strokeWidth={2.5} color={colors.safeText} iconSize={14} gap={6} textStyle={styles.result} style={styles.resultRow}>
          Approved · your plan is updated
        </StatusText>
      ) : (
        <Text style={[styles.result, styles.dismissed]}>Not applied. Your plan stays as it is.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.aiTint,
    borderWidth: 1,
    borderColor: colors.aiBorder,
  },
  tag: {
    alignSelf: 'flex-start',
    // The design's inline tag sits in a 16 px line box, 4 below the top.
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  tagText: {
    fontFamily: font.jakarta[700],
    fontSize: 11,
    color: colors.aiText,
  },
  title: {
    marginTop: 8,
    fontFamily: font.jakarta[700],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.35),
    color: colors.textPrimary,
  },
  reason: {
    marginTop: 4,
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  changes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  change: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius[10],
    backgroundColor: colors.white,
  },
  changeText: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textPrimary,
    ...tabular,
  },
  changeStrong: {
    fontFamily: font.inter[600],
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  action: {
    flex: 1,
  },
  resultRow: {
    marginTop: 12,
  },
  result: {
    fontFamily: font.inter[600],
    fontSize: 13,
  },
  dismissed: {
    marginTop: 12,
    color: colors.textSecondary,
  },
});
