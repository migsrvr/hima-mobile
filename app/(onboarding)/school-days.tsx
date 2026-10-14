import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { MascotAvatar } from '@/components/ai/MascotAvatar';
import { ClassHoursRow } from '@/components/schedule/ClassHoursRow';
import { ClassHoursSheet } from '@/components/schedule/ClassHoursSheet';
import { WeekdaySelector } from '@/components/schedule/WeekdaySelector';
import { HimaButton } from '@/components/ui/HimaButton';
import { Screen } from '@/components/ui/Screen';
import { StepHeader } from '@/components/ui/StepHeader';
import { Text } from '@/components/ui/Text';
import { useOnboardingStore } from '@/stores/onboarding';
import { colors, font, layout, lineHeight, radius } from '@/theme';
import { orderedWeek, type Weekday } from '@/types/schedule';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The first school day from today onward (today counts), or null when none are picked. */
function nextSchoolDay(days: readonly Weekday[], today: Weekday): Weekday | null {
  for (let i = 0; i < 7; i++) {
    const d = ((today + i) % 7) as Weekday;
    if (days.includes(d)) return d;
  }
  return null;
}

/** 04 University schedule (step 2 of 4). */
export default function SchoolDaysScreen() {
  const { weekStartsOn, schoolDays, classHours, toggleSchoolDay, setClassHours } = useOnboardingStore(
    useShallow((s) => ({
      weekStartsOn: s.weekStartsOn,
      schoolDays: s.schoolDays,
      classHours: s.classHours,
      toggleSchoolDay: s.toggleSchoolDay,
      setClassHours: s.setClassHours,
    })),
  );
  const [editing, setEditing] = useState<Weekday | null>(null);

  const ordered = orderedWeek(weekStartsOn).filter((d) => schoolDays.includes(d));
  const next = nextSchoolDay(schoolDays, new Date().getDay() as Weekday);
  const count = schoolDays.length;

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <HimaButton label="Continue" onPress={() => router.push('/expenses')} testID="schedule-continue" />
        </View>
      }>
      <StepHeader step={2} total={4} label="Schedule" onBack={() => router.back()} />
      <View style={styles.main}>
        <Text style={styles.title} accessibilityRole="header">
          Which days do you have class?
        </Text>
        <Text style={styles.subtitle}>School days get food and fare budgets. Free days get a lighter plan.</Text>

        <WeekdaySelector
          selected={schoolDays}
          onToggle={toggleSchoolDay}
          weekStartsOn={weekStartsOn}
          style={styles.days}
        />

        {ordered.length > 0 && (
          <>
            <View style={styles.hoursHead}>
              <Text style={styles.h2} accessibilityRole="header">
                Class hours
              </Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <View style={styles.hoursList}>
              {ordered.map((day) => (
                <ClassHoursRow
                  key={day}
                  day={day}
                  hours={classHours[day]}
                  isNext={day === next}
                  onPressHours={() => setEditing(day)}
                />
              ))}
            </View>
          </>
        )}

        <View style={styles.summary}>
          <MascotAvatar size={44} background="white" />
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>{`${plural(count, 'school day')} · ${plural(7 - count, 'free day')}`}</Text>
            <Text style={styles.summaryBody}>Class hours help Hima time reminders before you leave for school.</Text>
          </View>
        </View>
      </View>

      <ClassHoursSheet
        day={editing}
        hours={editing != null ? classHours[editing] : undefined}
        onSave={setClassHours}
        onClose={() => setEditing(null)}
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
  days: {
    marginTop: 20,
  },
  hoursHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  h2: {
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  optional: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  hoursList: {
    gap: 8,
    marginTop: 10,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius[16],
    backgroundColor: colors.backgroundSecondary,
  },
  summaryText: {
    flexShrink: 1,
  },
  summaryTitle: {
    fontFamily: font.jakarta[700],
    fontSize: 14,
    color: colors.textPrimary,
  },
  summaryBody: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.45),
    color: colors.textPrimary,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 28,
  },
});
