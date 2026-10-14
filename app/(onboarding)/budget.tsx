import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { BudgetBreakdownCard, type BreakdownRow } from '@/components/finance/BudgetBreakdownCard';
import { categoryVisuals } from '@/components/finance/categoryVisuals';
import { PlanSummaryCard } from '@/components/finance/PlanSummaryCard';
import { QuickFixOption } from '@/components/finance/QuickFixOption';
import { DayTypeCard } from '@/components/schedule/DayTypeCard';
import { HimaButton } from '@/components/ui/HimaButton';
import { Screen } from '@/components/ui/Screen';
import { StepHeader } from '@/components/ui/StepHeader';
import { Text } from '@/components/ui/Text';
import { buildWeeklyPlan, quickFixes, type QuickFix, type WeeklyPlan } from '@/services/budget/plan';
import { toPlanInputs, useOnboardingStore } from '@/stores/onboarding';
import { usePlanStore } from '@/stores/plan';
import { useSessionStore } from '@/stores/session';
import { colors, font, layout, lineHeight, radius } from '@/theme';
import { orderedWeek, type Weekday } from '@/types/schedule';
import { formatPeso } from '@/utils/money';

const peso = (n: number) => formatPeso(n, { compact: true });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Copy for each quick fix (06b). Numbers come from services/budget quickFixes. */
function fixCopy(f: QuickFix): { title: string; detail: string } {
  switch (f.field) {
    case 'savingsPerWeek':
      return { title: `Lower savings to ${peso(f.to)} a week`, detail: `Savings ${peso(f.from)} → ${peso(f.to)}` };
    case 'freeDaySpend':
      return { title: `Spend ${peso(f.to)} on free days`, detail: `Free days ${peso(f.from)} → ${peso(f.to)} a day` };
    case 'foodPerSchoolDay':
      return {
        title: `Lower food to ${peso(f.to)} a school day`,
        detail: `Food ${peso(f.from)} → ${peso(f.to)} per school day`,
      };
  }
}

/** "Where the numbers come from" rows, straight from the plan calculation. */
function breakdownRows(plan: WeeklyPlan, perSchoolDay: { food: number; transport: number }, freeDaySpend: number): BreakdownRow[] {
  const v = categoryVisuals;
  return [
    {
      key: 'food',
      icon: v.food.icon,
      tone: v.food.tone,
      title: 'Food',
      detail: `${peso(perSchoolDay.food)} × ${plural(plan.schoolDays, 'school day')}`,
      amount: plan.food,
    },
    {
      key: 'transport',
      icon: v.transport.icon,
      tone: v.transport.tone,
      title: 'Transport',
      detail: `${peso(perSchoolDay.transport)} × ${plural(plan.schoolDays, 'school day')}`,
      amount: plan.transport,
    },
    { key: 'school', icon: v.school.icon, tone: v.school.tone, title: 'School', detail: 'Your weekly estimate', amount: plan.school },
    {
      key: 'free',
      icon: v.other.icon,
      tone: v.other.tone,
      title: 'Free days',
      detail: `${peso(freeDaySpend)} × ${plural(plan.freeDays, 'free day')}`,
      amount: plan.freeDaySpending,
    },
    { key: 'savings', icon: v.savings.icon, tone: v.savings.tone, title: 'Savings', detail: 'Protected', amount: plan.savings },
    {
      key: 'emergency',
      icon: v.emergency.icon,
      tone: v.emergency.tone,
      title: 'Emergency reserve',
      detail: 'Protected',
      amount: plan.emergency,
    },
  ];
}

/** 06 Budget calculation (step 4 of 4), and 06b when the plan is over the allowance. */
export default function BudgetScreen() {
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
  const applyQuickFix = useOnboardingStore((s) => s.applyQuickFix);
  const confirmPlan = usePlanStore((s) => s.confirm);
  const userId = useSessionStore((s) => s.session?.user.id);
  const [fixIndex, setFixIndex] = useState(0);

  const inputs = toPlanInputs(draft);
  const plan = buildWeeklyPlan(inputs);
  const over = plan.overBy > 0;
  const fixes = over ? quickFixes(inputs) : [];
  const selectedFix = fixes[Math.min(fixIndex, fixes.length - 1)];

  const week = orderedWeek(draft.weekStartsOn);
  const schoolDays = week.filter((d) => draft.schoolDays.includes(d));
  const freeDays = week.filter((d) => !draft.schoolDays.includes(d));

  const editPreferences = () => (router.canGoBack() ? router.back() : router.replace('/expenses'));

  const confirm = () => {
    if (!userId) return;
    // Keep class hours only for days that are still school days.
    const classHours = Object.fromEntries(
      Object.entries(draft.classHours).filter(([d]) => draft.schoolDays.includes(Number(d) as Weekday)),
    );
    confirmPlan(userId, { inputs, weekStartsOn: draft.weekStartsOn, schoolDays: draft.schoolDays, classHours });
    if (router.canDismiss()) router.dismissAll();
    router.replace('/home');
  };

  const applyFix = () => {
    if (!selectedFix) return;
    applyQuickFix(selectedFix.field, selectedFix.to);
    setFixIndex(0);
    AccessibilityInfo.announceForAccessibility('Plan recalculated');
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {over ? (
            <HimaButton label="Apply and recalculate" onPress={applyFix} disabled={!selectedFix} testID="budget-apply" />
          ) : (
            <HimaButton label="Confirm plan" onPress={confirm} testID="budget-confirm" />
          )}
          <HimaButton label="Edit preferences" variant="secondary" onPress={editPreferences} />
        </View>
      }>
      <StepHeader step={4} total={4} label="Your plan" onBack={editPreferences} />
      <View style={styles.main}>
        <Text style={styles.title} accessibilityRole="header">
          {over ? 'Your plan needs a small fix' : "Here's your weekly plan"}
        </Text>
        <Text style={styles.subtitle}>
          {over
            ? `Your expenses and savings add up to more than your ${formatPeso(plan.weeklyAllowance)} weekly allowance.`
            : 'Built from your allowance, schedule and estimates. Nothing is saved until you confirm.'}
        </Text>

        <PlanSummaryCard plan={plan} style={styles.card} />

        {over ? (
          <View style={[styles.fixes, styles.card]}>
            <Text style={styles.h2} accessibilityRole="header">
              Pick a quick fix
            </Text>
            <Text style={styles.fixesNote}>{`Each one closes the ${formatPeso(plan.overBy)} gap. You can fine-tune later.`}</Text>
            <View style={styles.fixList} accessibilityRole="radiogroup">
              {fixes.map((f, i) => (
                <QuickFixOption
                  key={f.field}
                  {...fixCopy(f)}
                  selected={f === selectedFix}
                  onPress={() => setFixIndex(i)}
                />
              ))}
            </View>
          </View>
        ) : (
          <>
            <BudgetBreakdownCard
              title="Where the numbers come from"
              rows={breakdownRows(
                plan,
                { food: inputs.foodPerSchoolDay, transport: inputs.transportPerSchoolDay },
                inputs.freeDaySpend,
              )}
              style={styles.card}
            />
            <Text style={[styles.h2, styles.dailyHead]} accessibilityRole="header">
              Daily plan
            </Text>
            <View style={styles.dailyRow}>
              <DayTypeCard kind="school" amount={plan.schoolDayBudget} days={schoolDays} style={styles.dailyCard} />
              <DayTypeCard kind="free" amount={plan.freeDayBudget} days={freeDays} style={styles.dailyCard} />
            </View>
          </>
        )}
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
  card: {
    marginTop: 16,
  },
  h2: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  fixes: {
    padding: 16,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fixesNote: {
    marginTop: 4,
    marginBottom: 12,
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  fixList: {
    gap: 8,
  },
  dailyHead: {
    marginTop: 16,
  },
  dailyRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  dailyCard: {
    // Equal columns like the design's CSS grid, even though only one card has a border.
    flexBasis: '50%',
    flexShrink: 1,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
    gap: 8,
  },
});
