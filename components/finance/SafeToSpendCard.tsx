import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { HimaBadge, type BadgeStatus } from '@/components/ui/HimaBadge';
import { Check } from '@/components/ui/icons';
import { TestnetBadge } from '@/components/ui/TestnetBadge';
import { Text } from '@/components/ui/Text';
import { colors, font, radius, shadow, tabular } from '@/theme';
import { spokenPeso } from '@/utils/money';

import { MoneyDisplay } from './MoneyDisplay';

type Props = {
  /** Calculated by services/budget (wallet − remaining planned − protected). Never computed in the UI. */
  safeToSpend: number;
  walletBalance: number;
  /** "this week" / "today". */
  periodLabel: string;
  /** "Oct 12–18". */
  dateRange: string;
  status: Extract<BadgeStatus, 'onTrack' | 'overPlan'>;
  /** "₱10 under plan · about ₱184/day". */
  statusNote: string;
  /** "≈ 344.00 XLM": the wallet balance at the server's demo rate. Hidden while the rate is unknown. */
  walletAssetPreview?: string | null;
  testnet?: boolean;
  /** Blue glow under the card (07 Home). */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The blue hero: Safe-to-Spend first, wallet balance and testnet status always visible. */
export function SafeToSpendCard({
  safeToSpend,
  walletBalance,
  periodLabel,
  dateRange,
  status,
  statusNote,
  walletAssetPreview,
  testnet = true,
  elevated = true,
  style,
}: Props) {
  return (
    <View
      style={[styles.card, elevated && styles.elevated, style]}
      accessibilityRole="summary"
      accessibilityLabel={`Safe to spend ${periodLabel}`}>
      <View style={styles.topRow}>
        <Text style={styles.period}>{`Safe to spend · ${periodLabel}`}</Text>
        <View style={styles.rangeChip}>
          <Text style={styles.range}>{dateRange}</Text>
        </View>
      </View>

      <View>
        <MoneyDisplay amount={safeToSpend} size="hero" tone="inverse" />
        <View style={styles.statusRow}>
          {status === 'onTrack' ? (
            <HimaBadge status="onTrack" icon={Check} strokeWidth={2.5} dense />
          ) : (
            <HimaBadge status="overPlan" dense />
          )}
          <Text style={styles.statusNote}>{statusNote}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View
          accessible
          accessibilityLabel={`Wallet balance ${spokenPeso(walletBalance)}${walletAssetPreview ? `, about ${walletAssetPreview.replace('≈ ', '')} on testnet` : ''}`}>
          <Text style={styles.walletLabel}>Wallet balance</Text>
          <MoneyDisplay amount={walletBalance} size="balance" tone="inverse" style={styles.wallet} />
          {walletAssetPreview ? <Text style={styles.walletAsset}>{walletAssetPreview}</Text> : null}
        </View>
        {testnet && <TestnetBadge variant="onHero" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.deepSkyBlue,
    borderRadius: radius[20],
    padding: 20,
    gap: 14,
  },
  elevated: {
    boxShadow: shadow.hero,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  period: {
    fontFamily: font.jakarta[600],
    fontSize: 13,
    color: colors.white,
  },
  rangeChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.heroOutline,
  },
  range: {
    fontFamily: font.inter[600],
    fontSize: 12,
    color: colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  statusNote: {
    fontFamily: font.inter[500],
    fontSize: 13,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.heroDivider,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  walletLabel: {
    fontFamily: font.jakarta[600],
    fontSize: 12,
    color: colors.white,
  },
  wallet: {
    marginTop: 4,
  },
  // Not in the design (07): the testnet equivalent asked for in STELLAR_PAIFLOW_IMPLEMENTATION.md.
  walletAsset: {
    marginTop: 2,
    fontFamily: font.inter[500],
    fontSize: 12,
    color: colors.white,
    ...tabular,
  },
});
