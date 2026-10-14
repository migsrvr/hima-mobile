import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { HimaButton } from '@/components/ui/HimaButton';
import { MascotTip } from '@/components/ui/MascotTip';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SelectButton } from '@/components/ui/SelectButton';
import { StepHeader } from '@/components/ui/StepHeader';
import { Text } from '@/components/ui/Text';
import type { AllowancePeriod } from '@/services/budget/plan';
import { useOnboardingStore } from '@/stores/onboarding';
import { colors, font, layout, lineHeight, radius } from '@/theme';
import { WEEKDAY_NAMES, orderedWeek, type Weekday } from '@/types/schedule';
import { parseAmount } from '@/utils/money';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
] as const;

const WEEK_START_OPTIONS = orderedWeek(1).map((d) => ({ value: d, label: WEEKDAY_NAMES[d] }));

/** 03 Allowance setup (step 1 of 4). */
export default function AllowanceScreen() {
  const { allowance, period, weekStartsOn, setAllowance, setPeriod, setWeekStartsOn } = useOnboardingStore(
    useShallow((s) => ({
      allowance: s.allowance,
      period: s.period,
      weekStartsOn: s.weekStartsOn,
      setAllowance: s.setAllowance,
      setPeriod: s.setPeriod,
      setWeekStartsOn: s.setWeekStartsOn,
    })),
  );
  const [error, setError] = useState<string>();
  const [pickingStart, setPickingStart] = useState(false);

  const weekEnd = ((weekStartsOn + 6) % 7) as Weekday;

  const onContinue = () => {
    const value = parseAmount(allowance);
    if (value == null || value <= 0) {
      const message = 'Enter your allowance to continue';
      setError(message);
      AccessibilityInfo.announceForAccessibility(message);
      return;
    }
    router.push('/school-days');
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <HimaButton label="Continue" onPress={onContinue} testID="allowance-continue" />
        </View>
      }>
      <StepHeader
        step={1}
        total={4}
        label="Allowance"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
      />
      <View style={styles.main}>
        <Text style={styles.title} accessibilityRole="header">
          How much is your allowance?
        </Text>
        <Text style={styles.subtitle}>Enter what you actually receive. You can change it anytime.</Text>

        <SegmentedControl
          options={PERIODS}
          value={period}
          onChange={(p: AllowancePeriod) => setPeriod(p)}
          accessibilityLabel="Allowance period"
          style={styles.periods}
        />
        <Text style={styles.explain}>
          <Text style={styles.explainStrong}>Weekly</Text>
          {` means one amount that covers ${WEEKDAY_NAMES[weekStartsOn]} to ${WEEKDAY_NAMES[weekEnd]}. `}
          <Text style={styles.explainStrong}>Daily</Text>
          {' means the same amount every day.'}
        </Text>

        <MoneyInput
          label={period === 'weekly' ? 'Weekly allowance' : 'Daily allowance'}
          labelSize="lg"
          size="hero"
          value={allowance}
          onChangeValue={(raw) => {
            setAllowance(raw);
            if (error) setError(undefined);
          }}
          padDecimalsOnBlur
          placeholder="0.00"
          helperText="Philippine peso. Numbers only, no negative amounts."
          error={error}
          returnKeyType="done"
          style={styles.amount}
          testID="allowance-amount"
        />

        <View style={styles.weekStart}>
          <Text style={styles.weekStartLabel}>Your week starts on</Text>
          <SelectButton
            value={WEEKDAY_NAMES[weekStartsOn]}
            onPress={() => setPickingStart(true)}
            accessibilityLabel="Your week starts on"
          />
        </View>

        <MascotTip
          message="Count only money you get regularly. Gifts can go straight to savings later."
          style={styles.tip}
        />
      </View>

      <OptionSheet
        visible={pickingStart}
        title="Your week starts on"
        options={WEEK_START_OPTIONS}
        value={weekStartsOn}
        onSelect={setWeekStartsOn}
        onClose={() => setPickingStart(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: {
    paddingTop: 24,
    paddingHorizontal: layout.screenPadding,
  },
  title: {
    fontFamily: font.jakarta[800],
    fontSize: 26,
    lineHeight: lineHeight(26, 1.25),
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: font.inter[400],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.5),
    color: colors.textSecondary,
  },
  periods: {
    marginTop: 20,
  },
  explain: {
    marginTop: 10,
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
    color: colors.textSecondary,
  },
  explainStrong: {
    fontFamily: font.inter[600],
    color: colors.textPrimary,
  },
  amount: {
    marginTop: 20,
  },
  weekStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 16,
    borderRadius: radius[16],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekStartLabel: {
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
  },
  tip: {
    marginTop: 18,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 28,
  },
});
