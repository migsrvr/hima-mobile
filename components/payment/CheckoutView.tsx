import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { categoryVisuals, merchantIcons } from '@/components/finance/categoryVisuals';
import { HimaBadge } from '@/components/ui/HimaBadge';
import { HimaButton } from '@/components/ui/HimaButton';
import { HimaHeader } from '@/components/ui/HimaHeader';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowRight, Ban, Check, Sparkle, TriangleAlert } from '@/components/ui/icons';
import { Screen } from '@/components/ui/Screen';
import { TestnetBadge } from '@/components/ui/TestnetBadge';
import { Text } from '@/components/ui/Text';
import type { CheckoutEvaluation } from '@/services/payments/checkout';
import type { Merchant, MerchantOrder } from '@/services/payments/merchants';
import { colors, font, layout, letterSpacing, lineHeight, radius, tabular, type Tone } from '@/theme';
import type { BudgetCategory } from '@/types/finance';
import { formatPeso, spokenPeso } from '@/utils/money';

/** Merchant tile tones on checkout (12a canteen in green, 12b/12c bookstore in yellow). */
const MERCHANT_TONE: Record<BudgetCategory, Tone> = { food: 'safe', school: 'yellow', transport: 'blue', other: 'muted' };

/** Names for "covered by …" and the plan row. */
const PLAN_LABEL: Record<BudgetCategory, string> = {
  food: "Today's food plan",
  transport: "Today's transport plan",
  school: 'School plan',
  other: "Today's free-day plan",
};
const PLAN_SOURCE: Record<BudgetCategory, string> = {
  food: "today's food plan",
  transport: "today's transport plan",
  school: 'your school plan',
  other: "today's free-day plan",
};

type Props = {
  merchant: Merchant;
  order: MerchantOrder;
  evaluation: CheckoutEvaluation;
  /** "≈ 11.33 XLM": what settles on testnet at the server's demo rate. Hidden while the rate is unknown. */
  assetPreview?: string | null;
  /** "₱76.50 to Campus Canteen · ₱8.50 to your savings": the Flow 1 split, once the server has quoted it. */
  splitNote?: string | null;
  /** Hima AI note, written from the evaluation's numbers. */
  aiNote?: string;
  onBack: () => void;
  onPay: () => void;
  onPayAnyway: () => void;
  onCancel: () => void;
  onRescan: () => void;
};

const peso = (n: number) => formatPeso(n, { compact: true });

/** 12a–12c Checkout: what the payment does to the plan before anything is charged. */
export function CheckoutView({ merchant, order, evaluation: e, assetPreview, splitNote, aiNote, onBack, onPay, onPayAnyway, onCancel, onRescan }: Props) {
  const blocked = e.state === 'blocked';
  const over = e.state === 'overSafeToSpend';
  const dense = blocked || over;
  const after = e.after;

  let footer: ReactNode;
  if (blocked) {
    footer = (
      <View style={[styles.footer, styles.footerDense]}>
        <HimaButton label="Back to Home" onPress={onCancel} />
        <HimaButton label="Scan a new amount" variant="secondary" onPress={onRescan} />
      </View>
    );
  } else if (over) {
    const fromReserves = e.fromReserve + e.fromSavings;
    footer = (
      <View style={[styles.footer, styles.footerDense]}>
        <HimaButton label="Cancel payment" onPress={onCancel} />
        <HimaButton label={`Pay anyway, use ${peso(fromReserves)} of reserve`} variant="override" onPress={onPayAnyway} />
      </View>
    );
  } else {
    footer = (
      <View style={styles.footer}>
        <HimaButton
          label={`Confirm & Pay ${formatPeso(order.amount)}`}
          variant="pay"
          size="xl"
          elevated
          onPress={onPay}
          testID="checkout-pay"
        />
        <HimaButton label="Cancel" variant="text" size="compact" onPress={onCancel} />
      </View>
    );
  }

  return (
    <Screen footer={footer}>
      <HimaHeader leading="back" onLeadingPress={onBack} title="Checkout" trailing={<TestnetBadge />} />
      <View style={[styles.main, dense ? styles.gap12 : styles.gap14]}>
        <View style={styles.merchant}>
          <IconTile
            icon={merchantIcons[merchant.icon]}
            tone={MERCHANT_TONE[merchant.category]}
            size={48}
            radius={radius[14]}
            iconSize={22}
          />
          <View style={styles.merchantText}>
            <Text style={styles.merchantName}>{merchant.name}</Text>
            <View style={styles.verified}>
              <Text style={styles.merchantSub}>{`${categoryVisuals[merchant.category].label} ·`}</Text>
              {merchant.verified && <Check size={13} color={colors.safeText} strokeWidth={2.5} />}
              {merchant.verified && <Text style={styles.merchantSub}>Verified merchant</Text>}
            </View>
          </View>
        </View>

        <View style={[styles.amountBlock, !dense && styles.amountPad]}>
          <Text style={styles.amountLabel}>Amount from merchant</Text>
          <Text
            style={styles.amount}
            accessibilityLabel={`${spokenPeso(order.amount)}${assetPreview ? `, about ${assetPreview.replace('≈ ', '')} on testnet` : ''}`}>
            {formatPeso(order.amount)}
          </Text>
          {assetPreview ? (
            <Text style={styles.asset} accessibilityElementsHidden importantForAccessibility="no">
              {assetPreview}
            </Text>
          ) : null}
          <Text style={styles.description}>{order.description}</Text>
          {splitNote ? <Text style={styles.split}>{splitNote}</Text> : null}
        </View>

        {over && (
          <View style={[styles.alert, styles.alertWarning]} accessibilityRole="alert">
            <TriangleAlert size={20} color={colors.warningText} strokeWidth={2} style={styles.alertIcon} />
            <View style={styles.alertText}>
              <Text style={[styles.alertTitle, { color: colors.warningText }]}>
                {`${formatPeso(e.fromReserve + e.fromSavings)} over your Safe-to-Spend`}
              </Text>
              <Text style={styles.alertBody}>{overExplanation(e)}</Text>
            </View>
          </View>
        )}
        {blocked && (
          <View style={[styles.alert, styles.alertDanger]} accessibilityRole="alert">
            <Ban size={20} color={colors.dangerText} strokeWidth={2} style={styles.alertIcon} />
            <View style={styles.alertText}>
              <Text style={[styles.alertTitle, { color: colors.dangerText }]}>Payment blocked: not enough funds</Text>
              <Text style={styles.alertBody}>
                Payments can&apos;t go past your real wallet balance, even with an override. Nothing was charged.
              </Text>
            </View>
          </View>
        )}

        {blocked ? (
          <View style={styles.funds} accessibilityLabel="Funds check">
            <FundsRow label="Wallet balance" value={formatPeso(e.before.walletBalance)} divider />
            <FundsRow label="This payment" value={formatPeso(order.amount)} divider />
            <View style={styles.fundsRow}>
              <Text style={styles.shortLabel}>Short by</Text>
              <Text style={styles.shortValue}>{formatPeso(e.shortBy)}</Text>
            </View>
          </View>
        ) : (
          after && (
            <View style={[styles.after, over && styles.afterDense]} accessibilityLabel="Budget after this payment">
              <View style={[styles.afterHead, over && styles.afterHeadDense]}>
                <Text style={styles.afterTitle} accessibilityRole="header">
                  After this payment
                </Text>
                {over ? (
                  <HimaBadge status="overPlan" dense />
                ) : (
                  <HimaBadge status="confirmed" label="Within budget" dense />
                )}
              </View>
              <ChangeRow label="Wallet balance" from={e.before.walletBalance} to={after.walletBalance} dense={over} />
              <ChangeRow
                label="Safe-to-Spend"
                from={e.before.safeToSpend}
                to={after.safeToSpend}
                dense={over}
                note={
                  !over && e.fromSafeToSpend === 0 && e.fromPlan > 0
                    ? `Unchanged · covered by ${PLAN_SOURCE[merchant.category]}`
                    : undefined
                }
              />
              {over ? (
                <ChangeRow label="Emergency reserve" from={e.reserveBefore} to={e.reserveAfter} dense warn />
              ) : (
                <ChangeRow
                  label={PLAN_LABEL[merchant.category]}
                  from={e.planLeftBefore}
                  to={e.planLeftAfter}
                  toSuffix=" left"
                />
              )}
            </View>
          )
        )}

        {aiNote != null && (
          <View style={styles.ai} accessibilityLabel={`Hima AI: ${aiNote}`}>
            <Sparkle size={18} color={colors.ai} strokeWidth={2} style={styles.aiIcon} />
            <View style={styles.aiText}>
              <Text style={styles.aiLabel}>Hima AI</Text>
              <Text style={styles.aiBody}>{aiNote}</Text>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

/** "₱140 comes from your school plan and ₱920 from Safe-to-Spend. The last ₱90 …" (figures from the evaluation). */
function overExplanation(e: CheckoutEvaluation): string {
  const sources: string[] = [];
  if (e.fromPlan > 0) sources.push(`${peso(e.fromPlan)} comes from ${PLAN_SOURCE[e.category]}`);
  if (e.fromSafeToSpend > 0) {
    sources.push(`${peso(e.fromSafeToSpend)} ${sources.length ? 'from' : 'comes from'} Safe-to-Spend`);
  }
  const lead = sources.length ? `${sources.join(' and ')}. ` : '';
  if (e.fromSavings > 0) {
    return `${lead}${peso(e.fromReserve)} would come out of your emergency reserve and ${peso(e.fromSavings)} out of your savings.`;
  }
  return `${lead}The last ${peso(e.fromReserve)} would come out of your emergency reserve.`;
}

function ChangeRow({
  label,
  from,
  to,
  note,
  dense,
  warn,
  toSuffix = '',
}: {
  label: string;
  from: number;
  to: number;
  note?: string;
  dense?: boolean;
  warn?: boolean;
  toSuffix?: string;
}) {
  return (
    <View style={[styles.changeRow, dense && styles.changeRowDense]} accessible accessibilityLabel={`${label}: ${spokenPeso(from)} becomes ${spokenPeso(to)}${toSuffix}`}>
      <View style={styles.changeLine}>
        <Text style={styles.changeLabel}>{label}</Text>
        <View style={styles.changeValues}>
          <Text style={styles.changeFrom}>{formatPeso(from)}</Text>
          <ArrowRight size={14} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.changeTo, warn && { color: colors.warningText }]}>{`${formatPeso(to)}${toSuffix}`}</Text>
        </View>
      </View>
      {note != null && <Text style={styles.changeNote}>{note}</Text>}
    </View>
  );
}

function FundsRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <View style={[styles.fundsRow, divider && styles.fundsDivider]} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.fundsLabel}>{label}</Text>
      <Text style={styles.fundsValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    paddingTop: 8,
    paddingHorizontal: layout.screenPadding,
  },
  gap14: {
    gap: 14,
  },
  gap12: {
    gap: 12,
  },
  merchant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchantText: {
    flex: 1,
    minWidth: 0,
  },
  merchantName: {
    fontFamily: font.jakarta[700],
    fontSize: 17,
    color: colors.textPrimary,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  merchantSub: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  amountBlock: {
    alignItems: 'center',
  },
  amountPad: {
    paddingVertical: 4,
  },
  amountLabel: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  amount: {
    marginTop: 2,
    fontFamily: font.jakarta[800],
    fontSize: 44,
    lineHeight: lineHeight(44, 1.15),
    letterSpacing: letterSpacing(44, -0.02),
    color: colors.textPrimary,
    ...tabular,
  },
  // Not in the design (12a–12c): the testnet amount asked for in STELLAR_PAIFLOW_IMPLEMENTATION.md.
  asset: {
    marginTop: 2,
    fontFamily: font.inter[600],
    fontSize: 13,
    color: colors.blueText,
    ...tabular,
  },
  description: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Not in the design (12a): the 90/10 split of Flow 1, asked for in the multi-flow plan.
  split: {
    marginTop: 4,
    fontFamily: font.inter[500],
    fontSize: 12,
    color: colors.safeText,
    textAlign: 'center',
    ...tabular,
  },
  alert: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: radius[16],
    borderWidth: 1,
  },
  alertWarning: {
    backgroundColor: colors.yellowTint,
    borderColor: colors.yellowBorder,
  },
  alertDanger: {
    backgroundColor: colors.dangerTint,
    borderColor: colors.dangerBorder,
  },
  alertIcon: {
    marginTop: 1,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: font.jakarta[700],
    fontSize: 15,
  },
  alertBody: {
    marginTop: 4,
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
    color: colors.textPrimary,
  },
  after: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  afterDense: {
    paddingTop: 12,
    paddingBottom: 2,
  },
  afterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 10,
  },
  afterHeadDense: {
    paddingBottom: 8,
  },
  afterTitle: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  changeRow: {
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
  },
  changeRowDense: {
    paddingVertical: 10,
  },
  changeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  changeLabel: {
    flexShrink: 1,
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
  },
  changeValues: {
    // Both sides shrink, as in the design's flex row, so long values wrap too ("₱65.00 / left").
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeFrom: {
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
    ...tabular,
  },
  changeTo: {
    flexShrink: 1,
    fontFamily: font.jakarta[700],
    fontSize: 14,
    color: colors.textPrimary,
    ...tabular,
  },
  changeNote: {
    marginTop: 4,
    textAlign: 'right',
    fontFamily: font.inter[500],
    fontSize: 12,
    color: colors.safeText,
  },
  funds: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fundsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 11,
  },
  fundsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  fundsLabel: {
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
  },
  fundsValue: {
    fontFamily: font.inter[600],
    fontSize: 14,
    color: colors.textPrimary,
    ...tabular,
  },
  shortLabel: {
    fontFamily: font.jakarta[700],
    fontSize: 15,
    color: colors.textPrimary,
  },
  shortValue: {
    fontFamily: font.jakarta[800],
    fontSize: 15,
    color: colors.dangerText,
    ...tabular,
  },
  ai: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius[16],
    backgroundColor: colors.aiTint,
  },
  aiIcon: {
    marginTop: 2,
  },
  aiText: {
    flex: 1,
  },
  aiLabel: {
    fontFamily: font.jakarta[700],
    fontSize: 12,
    color: colors.aiText,
  },
  aiBody: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 14,
    lineHeight: lineHeight(14, 1.45),
    color: colors.textPrimary,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
    gap: 8,
  },
  footerDense: {
    paddingTop: 14,
  },
});
