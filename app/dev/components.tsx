import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AIInsightCard, AIStrong } from '@/components/ai/AIInsightCard';
import { MoneyDisplay } from '@/components/finance/MoneyDisplay';
import { SafeToSpendCard } from '@/components/finance/SafeToSpendCard';
import { SpendingProgress } from '@/components/finance/SpendingProgress';
import { TransactionRow } from '@/components/finance/TransactionRow';
import { WalletBalanceCard } from '@/components/finance/WalletBalanceCard';
import { DailyBudgetCard } from '@/components/schedule/DailyBudgetCard';
import { SchoolDayCard } from '@/components/schedule/SchoolDayCard';
import { WeekdaySelector } from '@/components/schedule/WeekdaySelector';
import { BottomSheetSurface, HimaBottomSheet } from '@/components/ui/HimaBottomSheet';
import { HimaBadge } from '@/components/ui/HimaBadge';
import { HimaButton } from '@/components/ui/HimaButton';
import { HimaEmptyState } from '@/components/ui/HimaEmptyState';
import { HimaHeader } from '@/components/ui/HimaHeader';
import { HimaInput } from '@/components/ui/HimaInput';
import { DialogSurface, HimaModal } from '@/components/ui/HimaModal';
import { IconTile } from '@/components/ui/IconTile';
import { FingerprintPattern, Nfc, Sparkle, TriangleAlert } from '@/components/ui/icons';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MAIN_TABS, TabBar } from '@/components/ui/TabBar';
import { TestnetBadge } from '@/components/ui/TestnetBadge';
import { Text } from '@/components/ui/Text';
import { colors, font, letterSpacing, lineHeight, radius } from '@/theme';
import type { Transaction } from '@/types/finance';
import type { Weekday } from '@/types/schedule';

/**
 * Dev-only replica of design/screens/Components.html, used to compare every
 * component variant against the board. Sample values mirror the board.
 */

// "Now" for relative times on the board: Wednesday 14 Oct 2026, evening.
const BOARD_NOW = new Date(2026, 9, 14, 18, 0);

const BOARD_TRANSACTIONS: Transaction[] = [
  {
    id: 'c1',
    merchantName: 'Campus Canteen',
    merchantIcon: 'utensils',
    category: 'food',
    amount: 85,
    direction: 'out',
    status: 'confirmed',
    createdAt: new Date(2026, 9, 14, 12, 5).toISOString(),
  },
  {
    id: 'c2',
    merchantName: 'Kape Corner',
    merchantIcon: 'coffee',
    category: 'other',
    amount: 120,
    direction: 'out',
    status: 'pending',
    createdAt: new Date(2026, 9, 14, 16, 10).toISOString(),
  },
  {
    id: 'c3',
    merchantName: 'Print & Copy Hub',
    merchantIcon: 'printer',
    category: 'school',
    amount: 60,
    direction: 'out',
    status: 'failed',
    createdAt: new Date(2026, 9, 12, 13, 15).toISOString(),
  },
];

const noop = () => {};

export default function ComponentsGallery() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [days, setDays] = useState<Weekday[]>([1, 3, 5]);
  const [food, setFood] = useState('150');
  const [email, setEmail] = useState('bea.reyes@example.com');
  const [blankEmail, setBlankEmail] = useState('');
  const [password, setPassword] = useState('hima12');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!__DEV__) return <Redirect href="/" />;

  const wide = width >= 2112;
  const pad = wide ? 48 : 16;
  const column = Math.min(480, width - pad * 2);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.board, { padding: pad, paddingTop: pad + insets.top }]}
      horizontal={false}>
      <View>
        <Text style={styles.kicker}>HIMA DESIGN SYSTEM</Text>
        <Text style={styles.h1}>Components</Text>
        <Text style={styles.lede}>Built once and reused on every screen. Code names match the component list in the spec.</Text>
      </View>

      <View style={styles.columns}>
        {/* Column 1 */}
        <View style={[styles.column, { width: column }]}>
          <Section title="Buttons" code="HimaButton">
            <View style={styles.grid2}>
              <Cell caption="PRIMARY">
                <HimaButton label="Continue" onPress={noop} />
              </Cell>
              <Cell caption="PAY · YELLOW = MONEY MOVES">
                <HimaButton label="Tap to Pay" variant="pay" icon={Nfc} iconStrokeWidth={2.2} onPress={noop} />
              </Cell>
              <Cell caption="SECONDARY">
                <HimaButton label="Edit plan" variant="secondary" onPress={noop} />
              </Cell>
              <Cell caption="HIMA AI">
                <HimaButton label="Ask Hima" variant="ai" icon={Sparkle} iconSize={18} onPress={noop} />
              </Cell>
              <Cell caption="TEXT">
                <HimaButton label="Cancel" variant="text" onPress={noop} />
              </Cell>
              <Cell caption="DISABLED">
                <HimaButton label="Continue" disabled />
              </Cell>
              <Cell caption="LOADING">
                <HimaButton label="Saving…" loading />
              </Cell>
              <Cell caption="OVERRIDE">
                <HimaButton label="Pay anyway" variant="override" onPress={noop} />
              </Cell>
            </View>
          </Section>

          <Section title="Inputs" code="HimaInput">
            <View style={[styles.grid2, styles.inputGrid]}>
              <View style={styles.half}>
                <HimaInput
                  label="Email"
                  value={blankEmail}
                  onChangeText={setBlankEmail}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  helperText="Default"
                  testID="gallery-email-default"
                />
              </View>
              <View style={styles.half}>
                <HimaInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  helperText="Focused"
                  testID="gallery-email-focused"
                />
              </View>
              <View style={styles.half}>
                <HimaInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  password
                  showToggle={false}
                  error="Use at least 8 characters"
                  testID="gallery-password"
                />
              </View>
              <View style={styles.half}>
                <MoneyInput
                  label="Food per school day"
                  value={food}
                  onChangeValue={setFood}
                  suffix="per school day"
                  helperText="Currency"
                />
              </View>
            </View>
          </Section>

          <Section title="Selectors" code="SegmentedControl · WeekdaySelector">
            <SegmentedControl
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
              ]}
              value={period}
              onChange={setPeriod}
            />
            <WeekdaySelector
              selected={days}
              onToggle={(d) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))}
            />
          </Section>

          <Section title="Screen header" code="HimaHeader">
            <HimaHeader
              leading="back"
              filledLeading
              onLeadingPress={noop}
              title="Checkout"
              trailing={<TestnetBadge />}
              style={styles.headerDemo}
            />
          </Section>
        </View>

        {/* Column 2 */}
        <View style={[styles.column, { width: column }]}>
          <Section title="Status badges" code="HimaBadge">
            <View style={styles.wrap}>
              <HimaBadge status="confirmed" />
              <HimaBadge status="onTrack" />
              <HimaBadge status="pending" />
              <HimaBadge status="overPlan" />
              <HimaBadge status="failed" />
              <HimaBadge status="notEnoughFunds" />
              <HimaBadge status="ai" />
              <HimaBadge status="schoolDay" />
              <TestnetBadge />
            </View>
          </Section>

          <Section title="Money" code="MoneyDisplay">
            <View style={styles.moneyList}>
              <MoneyRow caption="Hero · 40">
                <MoneyDisplay amount={920} size="hero" />
              </MoneyRow>
              <MoneyRow caption="Large · 24">
                <MoneyDisplay amount={2580} size="large" />
              </MoneyRow>
              <MoneyRow caption="Outgoing · 15">
                <MoneyDisplay amount={-40} />
              </MoneyRow>
              <MoneyRow caption="Incoming · 15">
                <MoneyDisplay amount={3000} tone="incoming" />
              </MoneyRow>
            </View>
            <Text style={styles.note}>
              Peso sign, comma thousands, two decimals, tabular figures and a true minus sign. Never truncate an amount;
              wrap the label instead.
            </Text>
          </Section>

          <Section title="Spending progress" code="SpendingProgress" gap={16}>
            <SpendingProgress label="Food" spent={145} planned={450} showCaption />
            <SpendingProgress label="Transport" spent={210} planned={240} showCaption />
            <SpendingProgress label="Other" spent={460} planned={400} showCaption />
          </Section>

          <Section title="Transactions" code="TransactionRow" padding={[12, 20, 8]} gap={0} headerPadding={[8, 0, 4]}>
            {BOARD_TRANSACTIONS.map((t, i) => (
              <TransactionRow key={t.id} transaction={t} now={BOARD_NOW} isLast={i === BOARD_TRANSACTIONS.length - 1} />
            ))}
          </Section>
        </View>

        {/* Column 3 */}
        <View style={[styles.column, { width: column }]}>
          <Section title="Safe-to-Spend" code="SafeToSpendCard">
            <SafeToSpendCard
              safeToSpend={920}
              walletBalance={2580}
              periodLabel="this week"
              dateRange="Oct 12–18"
              status="onTrack"
              statusNote="₱10 under plan · about ₱184/day"
              elevated={false}
            />
          </Section>

          <Section title="Wallet balance" code="WalletBalanceCard">
            <WalletBalanceCard balance={2580} network="Paiflow testnet" syncState="synced" />
          </Section>

          <Section title="AI insight" code="AIInsightCard">
            <AIInsightCard
              message={
                <>
                  Your Wednesdays usually run <AIStrong>₱60 over plan</AIStrong>, mostly snacks after class ends at 3 PM.
                </>
              }
              primaryAction={{ label: 'Ask Hima', onPress: noop }}
              secondaryAction={{ label: 'See the numbers', onPress: noop }}
            />
          </Section>

          <Section title="Schedule cards" code="SchoolDayCard · DailyBudgetCard">
            <View style={styles.row2}>
              <SchoolDayCard date={new Date(2026, 9, 16)} classHours={{ start: 600, end: 1020 }} style={styles.half12} />
              <DailyBudgetCard label="TODAY'S PLAN" spent={40} planned={230} style={styles.half12} />
            </View>
          </Section>

          <Section title="Bottom navigation" code="TabBar" padding={[20, 12, 12]} gap={10} headerPadding={[0, 8, 0]}>
            <TabBar items={MAIN_TABS} activeKey="home" onPress={noop} bottomPadding={0} style={styles.tabDemo} />
          </Section>
        </View>

        {/* Column 4 */}
        <View style={[styles.column, { width: column }]}>
          <Section title="Bottom sheet" code="HimaBottomSheet">
            <View style={styles.sheetPreview}>
              <BottomSheetSurface>
                <IconTile icon={FingerprintPattern} size={56} radius={radius.full} iconSize={28} tone="blue" />
                <Text style={styles.sheetTitle}>Authorize ₱85.00</Text>
                <Text style={styles.sheetSub}>to Campus Canteen</Text>
                <HimaButton label="Use fingerprint" variant="pay" onPress={noop} />
              </BottomSheetSurface>
            </View>
          </Section>

          <Section title="Dialog" code="HimaModal">
            <View style={styles.dialogPreview}>
              <DialogSurface
                icon={TriangleAlert}
                title="Use your emergency reserve?"
                message="This payment goes ₱90.00 past your Safe-to-Spend. Your reserve drops from ₱300.00 to ₱210.00."
                actions={[
                  { label: 'Pay anyway', onPress: noop, variant: 'override' },
                  { label: 'Keep reserve', onPress: noop, variant: 'primary' },
                ]}
              />
            </View>
          </Section>

          <Section title="Empty state" code="HimaEmptyState">
            <HimaEmptyState
              title="No payments yet"
              message="Tap to Pay at a Hima merchant and it shows up here, sorted into your budget."
              action={{ label: 'How Tap to Pay works', onPress: noop }}
            />
          </Section>
        </View>
      </View>

      {/* Live versions (below the board area): real modal sheet and dialog. */}
      <View style={[styles.column, { width: column }]}>
        <HimaButton label="Open bottom sheet" variant="secondary" onPress={() => setSheetOpen(true)} testID="open-sheet" />
        <HimaButton label="Open dialog" variant="secondary" onPress={() => setDialogOpen(true)} testID="open-dialog" />
      </View>
      <HimaBottomSheet visible={sheetOpen} onRequestClose={() => setSheetOpen(false)} accessibilityLabel="Authorize payment">
        <IconTile icon={FingerprintPattern} size={56} radius={radius.full} iconSize={28} tone="blue" />
        <Text style={styles.sheetTitle}>Authorize ₱85.00</Text>
        <Text style={styles.sheetSub}>to Campus Canteen</Text>
        <HimaButton label="Use fingerprint" variant="pay" onPress={() => setSheetOpen(false)} />
      </HimaBottomSheet>
      <HimaModal
        visible={dialogOpen}
        onRequestClose={() => setDialogOpen(false)}
        icon={TriangleAlert}
        title="Use your emergency reserve?"
        message="This payment goes ₱90.00 past your Safe-to-Spend. Your reserve drops from ₱300.00 to ₱210.00."
        actions={[
          { label: 'Pay anyway', onPress: () => setDialogOpen(false), variant: 'override' },
          { label: 'Keep reserve', onPress: () => setDialogOpen(false), variant: 'primary' },
        ]}
      />
    </ScrollView>
  );
}

function Section({
  title,
  code,
  children,
  gap = 14,
  padding = [20, 20, 20],
  headerPadding,
}: {
  title: string;
  code: string;
  children: ReactNode;
  gap?: number;
  padding?: [number, number, number];
  headerPadding?: [number, number, number];
}) {
  return (
    <View
      style={[
        styles.section,
        { gap, paddingTop: padding[0], paddingHorizontal: padding[1], paddingBottom: padding[2] },
      ]}>
      <View
        style={[
          styles.sectionHead,
          headerPadding && {
            paddingTop: headerPadding[0],
            paddingHorizontal: headerPadding[1],
            paddingBottom: headerPadding[2],
          },
        ]}>
        <Text style={styles.h2}>{title}</Text>
        <Text style={styles.code}>{code}</Text>
      </View>
      {children}
    </View>
  );
}

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <View style={styles.half}>
      <Text style={styles.caption}>{caption}</Text>
      {children}
    </View>
  );
}

function MoneyRow({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <View style={styles.moneyRow}>
      {children}
      <Text style={styles.moneyCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  board: {
    gap: 32,
  },
  kicker: {
    fontFamily: font.jakarta[700],
    fontSize: 12,
    letterSpacing: letterSpacing(12, 0.12),
    color: colors.deepSkyBlue,
  },
  h1: {
    marginTop: 6,
    fontFamily: font.jakarta[800],
    fontSize: 44,
    lineHeight: lineHeight(44, 1.15),
    letterSpacing: letterSpacing(44, -0.02),
    color: colors.textPrimary,
  },
  lede: {
    marginTop: 8,
    fontFamily: font.inter[400],
    fontSize: 16,
    color: colors.textSecondary,
  },
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 32,
  },
  column: {
    gap: 16,
  },
  section: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius[20],
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  h2: {
    fontFamily: font.jakarta[700],
    fontSize: 15,
    color: colors.textPrimary,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.textSecondary,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  row2: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGrid: {
    rowGap: 16,
  },
  half: {
    flexBasis: '40%',
    flexGrow: 1,
  },
  half12: {
    // Equal columns like the CSS grid, even when only one card has a border.
    flexBasis: '50%',
    flexShrink: 1,
  },
  caption: {
    marginBottom: 6,
    fontFamily: font.inter[600],
    fontSize: 11,
    letterSpacing: letterSpacing(11, 0.04),
    color: colors.textSecondary,
  },
  headerDemo: {
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    borderRadius: radius[14],
    backgroundColor: colors.background,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moneyList: {
    gap: 10,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  moneyCaption: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  note: {
    fontFamily: font.inter[400],
    fontSize: 12,
    lineHeight: lineHeight(12, 1.5),
    color: colors.textSecondary,
  },
  tabDemo: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  sheetPreview: {
    borderRadius: radius[16],
    overflow: 'hidden',
    backgroundColor: colors.scrimPreview,
    paddingTop: 28,
  },
  sheetTitle: {
    fontFamily: font.jakarta[700],
    fontSize: 18,
    color: colors.textPrimary,
  },
  sheetSub: {
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
  },
  dialogPreview: {
    borderRadius: radius[16],
    backgroundColor: colors.scrimPreview,
    padding: 24,
  },
});
