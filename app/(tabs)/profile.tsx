import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { FreighterLinkSheet, freighterBalanceLabel } from '@/components/finance/FreighterLinkSheet';
import { StellarWalletSheet } from '@/components/finance/StellarWalletSheet';
import { HimaBadge } from '@/components/ui/HimaBadge';
import { HimaButton } from '@/components/ui/HimaButton';
import { HimaSwitch } from '@/components/ui/HimaSwitch';
import { IconButton } from '@/components/ui/IconButton';
import {
  Banknote,
  Calendar,
  Check,
  CloudOff,
  FingerprintPattern,
  KeyRound,
  Link,
  Lock,
  LogOut,
  Pencil,
  Sparkle,
  Tag,
  Wallet,
} from '@/components/ui/icons';
import { InitialsAvatar } from '@/components/ui/InitialsAvatar';
import { Screen } from '@/components/ui/Screen';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsGroup';
import { TestnetBadge } from '@/components/ui/TestnetBadge';
import { Text } from '@/components/ui/Text';
import { useBudget } from '@/hooks/useBudget';
import { useChainSync } from '@/hooks/useChainSync';
import { useEditPlan } from '@/hooks/useEditPlan';
import { shortAccount } from '@/services/payments/accounts';
import { NETWORK_NAME } from '@/services/payments/network';
import { useSessionStore } from '@/stores/session';
import { useSettingsStore } from '@/stores/settings';
import { useWalletStore } from '@/stores/wallet';
import { colors, font, layout, radius } from '@/theme';
import { WEEKDAY_SHORT, orderedWeek } from '@/types/schedule';
import { formatPeso } from '@/utils/money';

/** 15 Profile & settings. */
export default function ProfileScreen() {
  useChainSync();
  const [stellarOpen, setStellarOpen] = useState(false);
  const [freighterOpen, setFreighterOpen] = useState(false);
  const budget = useBudget();
  const editPlan = useEditPlan();
  const logOut = useSessionStore((s) => s.logOut);
  const { connection, refreshChain } = useWalletStore(
    useShallow((s) => ({ connection: s.connection, refreshChain: s.refreshChain })),
  );
  const settings = useSettingsStore(
    useShallow((s) => ({
      aiSuggestions: s.aiSuggestions,
      paymentUpdates: s.paymentUpdates,
      dailySummary: s.dailySummary,
      appLock: s.appLock,
      toggle: s.toggle,
      freighter: s.freighter,
      setFreighter: s.setFreighter,
    })),
  );
  const { freighter, setFreighter } = settings;
  if (!budget) return <Screen edges={['top']}>{null}</Screen>;

  const { user, plan } = budget;
  const chain = budget.chain;
  const inputs = plan.inputs;
  const schoolDays = orderedWeek(plan.weekStartsOn)
    .filter((d) => plan.schoolDays.includes(d))
    .map((d) => WEEKDAY_SHORT[d])
    .join(', ');
  const expensesSet = [
    inputs.foodPerSchoolDay,
    inputs.transportPerSchoolDay,
    inputs.schoolPerWeek,
    inputs.freeDaySpend,
    inputs.emergencyPerWeek,
    inputs.savingsPerWeek,
  ].filter((v) => v > 0).length;

  const notAvailable = (what: string) => Alert.alert(what, `${what} isn't available in this demo yet.`);

  return (
    <Screen edges={['top']} contentStyle={styles.main}>
      <Text style={styles.title} accessibilityRole="header">
        Profile
      </Text>

      <View style={styles.account} accessibilityLabel="Your account">
        <InitialsAvatar firstName={user.firstName} lastName={user.lastName} size={60} />
        <View style={styles.accountText}>
          <Text style={styles.name}>{`${user.firstName} ${user.lastName}`.trim()}</Text>
          {/* One line; long addresses shrink to fit (the design's address is 1 px wider than its slot). */}
          <Text style={styles.email} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {user.email}
          </Text>
        </View>
        <IconButton
          icon={Pencil}
          accessibilityLabel="Edit profile"
          iconSize={18}
          onPress={() => notAvailable('Editing your profile')}
          style={styles.editButton}
        />
      </View>

      <SettingsGroup title="BUDGET">
        <SettingsRow
          icon={Banknote}
          iconTone="blue"
          label="Allowance"
          value={`${formatPeso(inputs.allowance)} ${inputs.period}`}
          tabularValue
          onPress={() => editPlan('/allowance')}
          divider
        />
        <SettingsRow
          icon={Calendar}
          iconTone="yellow"
          label="School days"
          value={schoolDays || 'None'}
          onPress={() => editPlan('/school-days')}
          divider
        />
        <SettingsRow
          icon={Tag}
          iconTone="muted"
          label="Expense categories"
          value={`${expensesSet} set`}
          onPress={() => editPlan('/expenses')}
        />
      </SettingsGroup>

      <SettingsGroup
        title="HIMA AI"
        tone="ai"
        tightRight
        footnote="Suggestions come from Groq. Your balances always come from your wallet, and nothing in your plan changes without your OK.">
        <SettingsRow
          icon={Sparkle}
          iconTone="ai"
          label="AI suggestions"
          detail="Hima suggests, you approve"
          minHeight={64}
          trailing={
            <HimaSwitch
              value={settings.aiSuggestions}
              onValueChange={() => settings.toggle('aiSuggestions')}
              accessibilityLabel="AI suggestions"
              tone="ai"
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="WALLET">
        <SettingsRow
          icon={Wallet}
          iconTone="blue"
          label="Stellar / Paiflow wallet"
          detail={chain ? shortAccount(chain.publicKey) : connection === 'checking' ? 'Checking…' : 'Not set up'}
          tabularDetail
          minHeight={60}
          divider
          trailing={<TestnetBadge />}
          onPress={() => setStellarOpen(true)}
        />
        <SettingsRow
          icon={Link}
          iconTone={connection === 'connected' ? 'safe' : 'muted'}
          label="Connection"
          divider
          trailing={
            connection === 'connected' ? (
              <HimaBadge status="synced" label="Connected" icon={Check} iconSize={13} dense />
            ) : connection === 'checking' ? (
              <HimaBadge status="pending" label="Checking…" dense />
            ) : connection === 'offline' ? (
              <HimaBadge status="pending" label="Offline" icon={CloudOff} iconSize={13} dense />
            ) : (
              <HimaBadge status="overPlan" label="Not set up" dense />
            )
          }
          onPress={() => void refreshChain()}
          accessibilityHint="Refreshes your wallet's testnet connection."
        />
        <SettingsRow
          icon={KeyRound}
          iconTone="muted"
          label="Freighter (testnet)"
          detail={freighter ? `${shortAccount(freighter.address)} · ${freighterBalanceLabel(freighter)}` : 'Not linked'}
          minHeight={60}
          onPress={() => setFreighterOpen(true)}
        />
      </SettingsGroup>

      <SettingsGroup title="NOTIFICATIONS" tightRight>
        <SettingsRow
          label="Payment updates"
          divider
          trailing={
            <HimaSwitch
              value={settings.paymentUpdates}
              onValueChange={() => settings.toggle('paymentUpdates')}
              accessibilityLabel="Payment updates"
            />
          }
        />
        <SettingsRow
          label="Daily summary"
          trailing={
            <HimaSwitch
              value={settings.dailySummary}
              onValueChange={() => settings.toggle('dailySummary')}
              accessibilityLabel="Daily summary"
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="SECURITY" tightRight>
        <SettingsRow
          icon={FingerprintPattern}
          iconTone="blue"
          label="App lock"
          detail="Fingerprint to open Hima and pay"
          minHeight={60}
          divider
          trailing={
            <HimaSwitch value={settings.appLock} onValueChange={() => settings.toggle('appLock')} accessibilityLabel="App lock" />
          }
        />
        <SettingsRow
          icon={Lock}
          iconTone="blue"
          label="Change password"
          onPress={() => notAvailable('Changing your password')}
          padRight
        />
      </SettingsGroup>

      <HimaButton
        label="Log out"
        variant="secondary"
        icon={LogOut}
        iconSize={18}
        accessibilityHint={`Signs you out of Hima on this phone. Your ${NETWORK_NAME} wallet stays as it is.`}
        onPress={async () => {
          await logOut();
          router.replace('/login');
        }}
      />
      <StellarWalletSheet
        visible={stellarOpen}
        chain={chain}
        connection={connection}
        onClose={() => setStellarOpen(false)}
      />
      <FreighterLinkSheet
        visible={freighterOpen}
        link={freighter}
        onSave={setFreighter}
        onRemove={() => setFreighter(null)}
        onClose={() => setFreighterOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: {
    gap: 16,
    paddingTop: 28,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },
  title: {
    fontFamily: font.jakarta[700],
    fontSize: 28,
    color: colors.textPrimary,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: font.jakarta[700],
    fontSize: 18,
    color: colors.textPrimary,
  },
  email: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  editButton: {
    backgroundColor: colors.background,
  },
});
