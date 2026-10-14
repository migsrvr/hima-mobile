import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { DetailRows } from '@/components/payment/DetailRows';
import { HimaBottomSheet } from '@/components/ui/HimaBottomSheet';
import { HimaButton } from '@/components/ui/HimaButton';
import { HimaInput } from '@/components/ui/HimaInput';
import { IconButton } from '@/components/ui/IconButton';
import { ExternalLink, X } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/services/api';
import { looksLikeStellarAddress, lookupStellarAccount, shortAccount } from '@/services/payments/accounts';
import { explorerAccountUrl } from '@/services/payments/network';
import type { FreighterLink } from '@/stores/settings';
import { colors, font, lineHeight } from '@/theme';
import { formatAsset, parseStroops } from '@/utils/asset';

type Props = {
  visible: boolean;
  link: FreighterLink | null;
  onSave: (link: FreighterLink) => void;
  onRemove: () => void;
  onClose: () => void;
};

export function freighterBalanceLabel(link: FreighterLink): string {
  if (!link.exists) return 'Not on testnet yet';
  const stroops = link.balance != null ? parseStroops(link.balance) : null;
  return stroops != null ? formatAsset(stroops, 'XLM') : 'Balance unavailable';
}

/**
 * Profile → Freighter (not in the design; asked for in STELLAR_PAIFLOW_IMPLEMENTATION.md).
 * Read-only: Hima shows the linked testnet account's balance. Freighter can't sign on the
 * phone, so a linked address never pays and never changes the budget.
 */
export function FreighterLinkSheet({ visible, link, onSave, onRemove, onClose }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  // Start clean every time the sheet opens (adjusted during render, not in an effect).
  const [openedWith, setOpenedWith] = useState(visible);
  if (visible !== openedWith) {
    setOpenedWith(visible);
    if (visible) {
      setValue('');
      setError(undefined);
      setBusy(false);
    }
  }

  const save = async () => {
    const address = value.trim().toUpperCase();
    if (!looksLikeStellarAddress(address)) {
      setError('Paste a Stellar public address: G followed by 55 letters and digits.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const account = await lookupStellarAccount(address);
      onSave({ address: account.address, exists: account.exists, balance: account.balance, checkedAt: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof ApiError && e.kind === 'http' ? e.message : "Couldn't reach Hima's server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <HimaBottomSheet visible={visible} onRequestClose={busy ? undefined : onClose} accessibilityLabel="Freighter testnet address" gap={0} paddingBottom={24} avoidKeyboard>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Freighter (testnet)
        </Text>
        <IconButton icon={X} accessibilityLabel="Close" onPress={onClose} disabled={busy} color={colors.textSecondary} iconSize={20} style={styles.close} />
      </View>
      <Text style={styles.sub}>
        Link your Freighter address to see its testnet balance here. It&apos;s read-only: Hima never pays from it, and your budget
        doesn&apos;t change.
      </Text>

      {link ? (
        <>
          <DetailRows
            variant="sheet"
            style={styles.details}
            rows={[
              { label: 'Linked address', value: shortAccount(link.address), numeric: true },
              { label: 'Balance', value: freighterBalanceLabel(link), numeric: true },
            ]}
          />
          <HimaButton
            label="View on Stellar.Expert"
            variant="text"
            size="compact"
            icon={ExternalLink}
            iconSize={16}
            iconPosition="end"
            onPress={() => Linking.openURL(explorerAccountUrl(link.address))}
            style={styles.explorer}
          />
        </>
      ) : null}

      <HimaInput
        label={link ? 'Replace with another address' : 'Freighter public address'}
        size="lg"
        value={value}
        onChangeText={(t) => {
          setValue(t);
          if (error) setError(undefined);
        }}
        placeholder="G…"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        returnKeyType="done"
        onSubmitEditing={save}
        error={error}
        style={styles.input}
      />
      <HimaButton label={busy ? 'Checking…' : link ? 'Update address' : 'Link address'} loading={busy} onPress={save} style={styles.primary} />
      {link ? <HimaButton label="Remove link" variant="text" size="compact" disabled={busy} onPress={onRemove} style={styles.remove} /> : null}
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
  details: {
    marginTop: 14,
  },
  explorer: {
    marginTop: 2,
  },
  input: {
    alignSelf: 'stretch',
    marginTop: 14,
  },
  primary: {
    marginTop: 16,
  },
  remove: {
    marginTop: 6,
  },
});
