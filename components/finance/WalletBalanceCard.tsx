import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { HimaBadge } from '@/components/ui/HimaBadge';
import { IconTile } from '@/components/ui/IconTile';
import { Wallet } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { colors, font, radius } from '@/theme';

import { MoneyDisplay } from './MoneyDisplay';

type Props = {
  balance: number;
  /** "Paiflow testnet". */
  network: string;
  /** Synced = balance matches the chain; syncing = refresh in flight. */
  syncState: 'synced' | 'syncing';
  style?: StyleProp<ViewStyle>;
};

/** Wallet row: icon, "Wallet balance · network", balance, sync badge. */
export function WalletBalanceCard({ balance, network, syncState, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <IconTile icon={Wallet} tone="blue" size={44} />
      <View style={styles.middle}>
        <Text style={styles.label}>{`Wallet balance · ${network}`}</Text>
        <MoneyDisplay amount={balance} size="balance" style={styles.amount} />
      </View>
      {syncState === 'synced' ? <HimaBadge status="synced" /> : <HimaBadge status="pending" label="Syncing" />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius[16],
    borderWidth: 1,
    borderColor: colors.border,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  amount: {
    marginTop: 2,
  },
});
