import * as Clipboard from 'expo-clipboard';
import { AccessibilityInfo, Linking, StyleSheet, View } from 'react-native';

import { DetailRows } from '@/components/payment/DetailRows';
import { HimaBottomSheet } from '@/components/ui/HimaBottomSheet';
import { HimaButton } from '@/components/ui/HimaButton';
import { IconButton } from '@/components/ui/IconButton';
import { Copy, ExternalLink, X } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { explorerAccountUrl, explorerContractUrl, NETWORK_NAME } from '@/services/payments/network';
import type { ChainConnection, ChainWallet } from '@/stores/wallet';
import { colors, font, lineHeight, radius, tabular } from '@/theme';
import { formatAsset, parseRateCentavos, parseStroops } from '@/utils/asset';
import { formatPeso } from '@/utils/money';

type Props = {
  visible: boolean;
  chain: ChainWallet | null;
  connection: ChainConnection;
  onClose: () => void;
};

/**
 * Profile → Wallet details (not in the design; asked for in STELLAR_PAIFLOW_IMPLEMENTATION.md).
 * Built from the 13a sheet pieces: Hima's testnet paying account, its balance and the demo rate.
 */
export function StellarWalletSheet({ visible, chain, connection, onClose }: Props) {
  const balance = chain?.balance != null ? parseStroops(chain.balance) : null;
  const rate = chain ? parseRateCentavos(chain.phpPerUnit) : null;

  const copy = async () => {
    if (!chain) return;
    await Clipboard.setStringAsync(chain.publicKey);
    AccessibilityInfo.announceForAccessibility('Wallet address copied');
  };

  return (
    <HimaBottomSheet visible={visible} onRequestClose={onClose} accessibilityLabel="Stellar / Paiflow wallet" gap={0} paddingBottom={24}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Stellar / Paiflow wallet
        </Text>
        <IconButton icon={X} accessibilityLabel="Close" onPress={onClose} color={colors.textSecondary} iconSize={20} style={styles.close} />
      </View>
      <Text style={styles.sub}>Hima pays merchants from this testnet account through your Paiflow flow. It only holds test funds.</Text>

      {chain ? (
        <>
          <View style={styles.keyBox}>
            <View style={styles.keyText}>
              <Text style={styles.keyLabel}>Public address</Text>
              <Text style={styles.key} selectable accessibilityLabel={`Public address ${chain.publicKey.split('').join(' ')}`}>
                {chain.publicKey}
              </Text>
            </View>
            <IconButton icon={Copy} accessibilityLabel="Copy wallet address" onPress={copy} color={colors.deepSkyBlue} iconSize={18} />
          </View>

          <DetailRows
            variant="sheet"
            style={styles.details}
            rows={[
              {
                label: 'Balance',
                value: balance != null ? formatAsset(balance, chain.assetCode) : connection === 'offline' ? 'Offline' : 'Unavailable',
                numeric: true,
              },
              { label: 'Demo rate', value: rate != null ? `1 ${chain.assetCode} = ${formatPeso(rate / 100)}` : '—', numeric: true },
              { label: 'Paiflow deployment', value: `${chain.deploymentId.slice(0, 8)}…`, numeric: true },
              { label: 'Network', value: NETWORK_NAME },
            ]}
          />

          <HimaButton
            label="View on Stellar.Expert"
            variant="secondary"
            icon={ExternalLink}
            iconSize={16}
            iconPosition="end"
            onPress={() => Linking.openURL(explorerAccountUrl(chain.publicKey))}
            style={styles.primary}
          />
          {chain.triggerContract ? (
            <HimaButton
              label="View Paiflow contract"
              variant="text"
              size="compact"
              onPress={() => Linking.openURL(explorerContractUrl(chain.triggerContract as string))}
              style={styles.secondary}
            />
          ) : null}
        </>
      ) : (
        <Text style={styles.empty}>
          {connection === 'checking'
            ? 'Checking the testnet wallet…'
            : "Hima's server hasn't shared the testnet wallet yet. Check your connection, then open this again."}
        </Text>
      )}
    </HimaBottomSheet>
  );
}

const styles = StyleSheet.create({
  head: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  title: {
    flex: 1,
    fontFamily: font.jakarta[800],
    fontSize: 20,
    color: colors.textPrimary,
  },
  close: {
    marginRight: -10,
  },
  sub: {
    alignSelf: 'stretch',
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 14,
    lineHeight: lineHeight(14, 1.45),
    color: colors.textSecondary,
  },
  keyBox: {
    alignSelf: 'stretch',
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 4,
    borderRadius: radius[16],
    backgroundColor: colors.backgroundSecondary,
  },
  keyText: {
    flex: 1,
    minWidth: 0,
  },
  keyLabel: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  key: {
    marginTop: 2,
    fontFamily: font.inter[600],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.45),
    color: colors.textPrimary,
    ...tabular,
  },
  details: {
    marginTop: 12,
  },
  primary: {
    marginTop: 18,
  },
  secondary: {
    marginTop: 6,
  },
  empty: {
    alignSelf: 'stretch',
    marginTop: 16,
    fontFamily: font.inter[400],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.5),
    color: colors.textPrimary,
  },
});
