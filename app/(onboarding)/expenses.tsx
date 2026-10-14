import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { HimaButton } from '@/components/ui/HimaButton';
import { Shield } from '@/components/ui/icons';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Screen } from '@/components/ui/Screen';
import { StatusText } from '@/components/ui/StatusText';
import { StepHeader } from '@/components/ui/StepHeader';
import { Text } from '@/components/ui/Text';
import { TintChip } from '@/components/ui/TintChip';
import { buildWeeklyPlan } from '@/services/budget/plan';
import { toPlanInputs, useOnboardingStore, type ExpenseKey } from '@/stores/onboarding';
import { colors, font, layout, lineHeight, type Tone } from '@/theme';
import { formatPeso } from '@/utils/money';

const FREQUENCY = {
  schoolDay: { label: 'per school day', tone: 'yellow' },
  week: { label: 'per week', tone: 'blueText' },
  freeDay: { label: 'per free day', tone: 'neutral' },
} as const satisfies Record<string, { label: string; tone: Tone }>;

type FieldSpec = {
  key: ExpenseKey;
  label: string;
  frequency: keyof typeof FREQUENCY;
  /** Note inside the field: a weekly total or a hint. */
  suffix?: string;
};

/** 05 Expense setup (step 3 of 4). */
export default function ExpensesScreen() {
  const draft = useOnboardingStore(
    useShallow((s) => ({
      allowance: s.allowance,
      period: s.period,
      weekStartsOn: s.weekStartsOn,
      schoolDays: s.schoolDays,
      classHours: s.classHours,
      expenses: s.expenses,
    })),
  );
  const setExpense = useOnboardingStore((s) => s.setExpense);
  // Weekly totals shown inside the fields come from the plan calculation, not the screen.
  const plan = buildWeeklyPlan(toPlanInputs(draft));
  const weekly = (n: number) => `${formatPeso(n, { compact: true })} a week`;

  const spending: FieldSpec[] = [
    { key: 'food', label: 'Food', frequency: 'schoolDay', suffix: weekly(plan.food) },
    { key: 'transport', label: 'Transportation', frequency: 'schoolDay', suffix: weekly(plan.transport) },
    { key: 'school', label: 'School expenses', frequency: 'week', suffix: 'prints, supplies' },
    { key: 'freeDay', label: 'Free-day spending', frequency: 'freeDay', suffix: weekly(plan.freeDaySpending) },
  ];
  const setAside: FieldSpec[] = [
    { key: 'emergency', label: 'Emergency reserve', frequency: 'week' },
    { key: 'savings', label: 'Savings', frequency: 'week' },
  ];

  const field = (f: FieldSpec) => (
    <MoneyInput
      key={f.key}
      label={f.label}
      labelSize="lg"
      labelAccessory={<TintChip label={FREQUENCY[f.frequency].label} tone={FREQUENCY[f.frequency].tone} />}
      size="lg"
      value={draft.expenses[f.key]}
      onChangeValue={(raw) => setExpense(f.key, raw)}
      suffix={f.suffix}
      placeholder="0"
      accessibilityHint={FREQUENCY[f.frequency].label}
      testID={`expense-${f.key}`}
    />
  );

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <HimaButton label="See my plan" onPress={() => router.push('/budget')} testID="expenses-continue" />
        </View>
      }>
      <StepHeader step={3} total={4} label="Expenses" onBack={() => router.back()} />
      <View style={styles.main}>
        <Text style={styles.title} accessibilityRole="header">
          What do you usually spend?
        </Text>
        <Text style={styles.subtitle}>Rough guesses are fine. After a week, Hima can suggest better numbers.</Text>

        <Text style={[styles.h2, styles.spendingHead]} accessibilityRole="header">
          Spending
        </Text>
        <View style={styles.fields}>{spending.map(field)}</View>

        <View style={styles.setAsideHead}>
          <Text style={styles.h2} accessibilityRole="header">
            Set aside
          </Text>
          <StatusText
            icon={Shield}
            strokeWidth={2.2}
            color={colors.safeText}
            iconSize={13}
            gap={4}
            textStyle={styles.protectedNote}>
            Never counted as Safe-to-Spend
          </StatusText>
        </View>
        <View style={styles.fields}>{setAside.map(field)}</View>
      </View>
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
  h2: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  spendingHead: {
    marginTop: 24,
  },
  fields: {
    gap: 14,
    marginTop: 12,
  },
  setAsideHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 24,
  },
  protectedNote: {
    fontFamily: font.inter[600],
    fontSize: 12,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 28,
  },
});
