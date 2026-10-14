import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AIInsightCard, AIStrong } from '@/components/ai/AIInsightCard';
import { BudgetCategoryCard } from '@/components/finance/BudgetCategoryCard';
import { RecentActivityCard } from '@/components/finance/RecentActivityCard';
import { SafeToSpendCard } from '@/components/finance/SafeToSpendCard';
import { TodayPlanCard, type PlanCell } from '@/components/schedule/TodayPlanCard';
import { HimaButton } from '@/components/ui/HimaButton';
import { Bell, Nfc } from '@/components/ui/icons';
import { InitialsAvatar } from '@/components/ui/InitialsAvatar';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useBudget } from '@/hooks/useBudget';
import { useChainSync } from '@/hooks/useChainSync';
import { homeInsight } from '@/services/ai';
import { categoryLeft, nextSchoolDay } from '@/services/budget/week';
import { deriveNotifications } from '@/services/notifications';
import { useSettingsStore } from '@/stores/settings';
import { colors, font, layout, lineHeight, radius } from '@/theme';
import { approxAsset } from '@/utils/asset';
import { formatDateRange, formatLongDate } from '@/utils/date';
import { formatPeso } from '@/utils/money';

const peso = (n: number) => formatPeso(n, { compact: true });

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** 07 Home dashboard. */
export default function HomeScreen() {
  const budget = useBudget();
  const aiOn = useSettingsStore((s) => s.aiSuggestions);
  useChainSync();
  if (!budget) return <Screen edges={['top']}>{null}</Screen>;

  const { user, plan, summary, now, transactions } = budget;
  const today = summary.today;
  const under = summary.underPlan;
  const statusNote =
    `${under === 0 ? 'Right on plan' : `${peso(Math.abs(under))} ${under > 0 ? 'under' : 'over'} plan`}` +
    ` · about ${peso(summary.perDay)}/day`;

  const cells: PlanCell[] =
    today.kind === 'school'
      ? [
          { label: 'Food plan left', left: categoryLeft(summary, 'food'), plan: today.plan.food },
          { label: 'Transport plan left', left: categoryLeft(summary, 'transport'), plan: today.plan.transport },
        ]
      : [{ label: 'Free-day plan left', left: categoryLeft(summary, 'other'), plan: today.plan.other }];

  const recent = transactions
    .filter((t) => t.status !== 'failed')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const insight = homeInsight(budget);
  const notifications = deriveNotifications(summary, transactions, aiOn);

  return (
    <Screen edges={['top']} contentStyle={styles.main}>
      <View style={styles.header}>
        <InitialsAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          onPress={() => router.navigate('/profile')}
          accessibilityLabel="Your profile"
        />
        <View style={styles.headerText}>
          <Text style={styles.date}>{formatLongDate(now)}</Text>
          <Text style={styles.greeting} accessibilityRole="header">{`${greeting(now)}, ${user.firstName}`}</Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert(
              'Notifications',
              notifications.length > 0
                ? notifications.map((n) => `${n.title}. ${n.body}`).join('\n\n')
                : 'You are all caught up.',
            )
          }
          accessibilityRole="button"
          accessibilityLabel={notifications.length > 0 ? `Notifications, ${notifications.length} unread` : 'Notifications'}
          style={styles.bell}>
          <Bell size={20} color={colors.navy} strokeWidth={2} />
          {notifications.length > 0 && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      <SafeToSpendCard
        safeToSpend={summary.safeToSpend}
        walletBalance={budget.walletBalance}
        periodLabel="this week"
        dateRange={formatDateRange(summary.start, summary.end)}
        status={summary.status}
        statusNote={statusNote}
        walletAssetPreview={approxAsset(budget.walletBalance, budget.chain)}
      />

      <HimaButton
        label="Tap to Pay"
        variant="pay"
        size="xl"
        icon={Nfc}
        iconStrokeWidth={2.2}
        elevated
        onPress={() => router.push('/payment/scan')}
        testID="home-tap-to-pay"
      />

      <TodayPlanCard
        kind={today.kind}
        classHours={today.classHours}
        cells={cells}
        nextSchoolDay={nextSchoolDay(plan, now)}
        onOpenSchedule={() => router.navigate('/schedule')}
      />

      {aiOn && (
        <AIInsightCard
          labelIcon="sparkles"
          message={insight.runs.map((r, i) => (r.strong ? <AIStrong key={i}>{r.text}</AIStrong> : r.text))}
          footnote={insight.footnote}
          primaryAction={{ label: 'Ask Hima', onPress: () => router.push('/assistant') }}
          secondaryAction={{
            label: 'See the numbers',
            onPress: () => router.push({ pathname: '/assistant', params: { ask: 'Why do I overspend on Wednesdays?' } }),
          }}
        />
      )}

      <BudgetCategoryCard
        lines={summary.lines}
        spent={summary.spentByCategory}
        spentTotal={summary.spentTotal}
        plannedTotal={summary.plannedTotal}
        savings={summary.savings}
        emergency={summary.emergency}
      />

      <RecentActivityCard
        transactions={recent}
        now={now}
        onSeeAll={() => router.navigate('/insights')}
        onHowItWorks={() => router.push('/payment/scan')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  greeting: {
    marginTop: 2,
    fontFamily: font.jakarta[700],
    fontSize: 20,
    lineHeight: lineHeight(20, 1.25),
    color: colors.textPrimary,
  },
  bell: {
    width: layout.minTouch,
    height: layout.minTouch,
    borderRadius: radius[14],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.deepSkyBlue,
  },
});
