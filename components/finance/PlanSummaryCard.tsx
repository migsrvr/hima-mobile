import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { TriangleAlert } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import type { WeeklyPlan } from '@/services/budget/plan';
import { colors, font, letterSpacing, lineHeight, radius, shadow, tabular } from '@/theme';
import { formatPeso } from '@/utils/money';

import { MoneyDisplay } from './MoneyDisplay';

type Props = {
  plan: WeeklyPlan;
  style?: StyleProp<ViewStyle>;
};

const pct = (share: number) => Math.round(share * 100);

/**
 * 06 Budget plan summary. When the plan fits: Safe-to-Spend in green, then the
 * allowance split. When it doesn't (06b): the shortfall in amber, then what the
 * plan needs. Every figure comes from services/budget, never from the UI.
 */
export function PlanSummaryCard({ plan, style }: Props) {
  const over = plan.overBy > 0;
  const lastColor = over ? colors.danger : colors.safe;
  const shares = [pct(plan.split.planned), pct(plan.split.protected), pct(plan.split.last)];
  const segments = [
    { key: 'planned', share: shares[0], color: colors.skyBlue },
    { key: 'protected', share: shares[1], color: colors.navy },
    { key: 'last', share: shares[2], color: lastColor },
  ].filter((seg) => seg.share > 0);
  const barLabel = over
    ? `Plan split: planned spending ${shares[0]} percent, protected ${shares[1]} percent, over allowance ${shares[2]} percent`
    : `Allowance split: planned spending ${shares[0]} percent, protected ${shares[1]} percent, Safe-to-Spend ${shares[2]} percent`;

  return (
    <View style={[styles.card, style]} accessibilityLabel="Plan summary">
      {over ? (
        <View style={[styles.box, styles.boxOver]} accessibilityRole="alert">
          <View style={styles.alertTitle}>
            <TriangleAlert size={15} color={colors.warningText} strokeWidth={2.2} />
            <Text style={[styles.boxTitle, styles.textWarning]}>Over your allowance by</Text>
          </View>
          <MoneyDisplay amount={plan.overBy} size="hero" style={styles.boxAmount} />
          <Text style={[styles.boxNote, styles.textWarning]}>{`Safe-to-Spend would be ${formatPeso(0)} every week`}</Text>
        </View>
      ) : (
        <View style={[styles.box, styles.boxSafe]}>
          <Text style={[styles.boxTitle, styles.textSafe]}>Safe to spend each week</Text>
          <MoneyDisplay amount={plan.safeToSpend} size="hero" style={styles.boxAmount} />
          <Text style={[styles.boxNote, styles.textSafe]}>
            {`About ${formatPeso(plan.safePerDay, { compact: true })}/day on top of your plan`}
          </Text>
        </View>
      )}

      <Text style={styles.source}>
        {over ? 'Your plan needs ' : 'From your '}
        <Text style={styles.sourceStrong}>{formatPeso(over ? plan.needed : plan.weeklyAllowance)}</Text>
        {over ? ' a week' : ' weekly allowance'}
      </Text>

      <View style={styles.bar} accessible accessibilityRole="image" accessibilityLabel={barLabel}>
        {segments.map((seg, i) => (
          <View
            key={seg.key}
            style={[
              styles.segment,
              { backgroundColor: seg.color },
              i === 0 && styles.segFirst,
              // The last visible segment fills what is left and carries the rounded end.
              i === segments.length - 1 ? styles.segLast : { width: `${seg.share}%` },
            ]}
          />
        ))}
      </View>

      <View style={styles.legend}>
        <LegendRow color={colors.skyBlue} label="Planned spending" amount={plan.planned} />
        <LegendRow color={colors.navy} label="Protected" note="(savings + reserve)" amount={plan.protected} />
        {over ? (
          <LegendRow color={colors.danger} label="More than you receive" amount={plan.overBy} strong={colors.dangerText} />
        ) : (
          <LegendRow color={colors.safe} label="Safe-to-Spend" amount={plan.safeToSpend} strong={colors.safeText} />
        )}
      </View>
    </View>
  );
}

function LegendRow({
  color,
  label,
  note,
  amount,
  strong,
}: {
  color: string;
  label: string;
  note?: string;
  amount: number;
  /** Bold, colored figure for the last row. */
  strong?: string;
}) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>
        {label}
        {note != null && <Text style={styles.legendNote}>{` ${note}`}</Text>}
      </Text>
      <Text style={[styles.legendValue, strong != null && { fontFamily: font.inter[700], color: strong }]}>
        {formatPeso(amount)}
      </Text>
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
    boxShadow: shadow.cardSoft,
  },
  box: {
    padding: 16,
    borderRadius: radius[16],
  },
  boxSafe: {
    backgroundColor: colors.safeTint,
  },
  boxOver: {
    backgroundColor: colors.yellowTint,
  },
  alertTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boxTitle: {
    fontFamily: font.jakarta[700],
    fontSize: 13,
  },
  textSafe: {
    color: colors.safeText,
  },
  textWarning: {
    color: colors.warningText,
  },
  boxAmount: {
    marginTop: 4,
    lineHeight: lineHeight(40, 1.15),
    letterSpacing: letterSpacing(40, -0.02),
  },
  boxNote: {
    marginTop: 6,
    fontFamily: font.inter[500],
    fontSize: 13,
  },
  source: {
    marginTop: 14,
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  sourceStrong: {
    fontFamily: font.inter[600],
    color: colors.textPrimary,
  },
  bar: {
    flexDirection: 'row',
    gap: 3,
    height: 12,
    marginTop: 10,
  },
  segment: {
    height: '100%',
    borderRadius: radius[3],
  },
  segFirst: {
    borderTopLeftRadius: radius.full,
    borderBottomLeftRadius: radius.full,
  },
  segLast: {
    flex: 1,
    borderTopRightRadius: radius.full,
    borderBottomRightRadius: radius.full,
  },
  legend: {
    gap: 6,
    marginTop: 14,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: radius[3],
  },
  legendLabel: {
    flex: 1,
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textPrimary,
    // The design sets tabular figures on the whole legend; in Inter that also widens hyphens.
    ...tabular,
  },
  legendNote: {
    color: colors.textSecondary,
  },
  legendValue: {
    fontFamily: font.inter[600],
    fontSize: 14,
    color: colors.textPrimary,
    ...tabular,
  },
});
