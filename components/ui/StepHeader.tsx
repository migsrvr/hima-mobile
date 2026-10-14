import { StyleSheet, View } from 'react-native';

import { colors, font, radius } from '@/theme';

import { HimaHeader } from './HimaHeader';
import { Text } from './Text';

type Props = {
  step: number;
  total: number;
  /** "Allowance", "Schedule", "Expenses", "Your plan". */
  label: string;
  onBack: () => void;
};

/** Onboarding header: back arrow, "Step 1 of 4 · Allowance" and a segmented progress bar. */
export function StepHeader({ step, total, label, onBack }: Props) {
  return (
    <HimaHeader leading="back" onLeadingPress={onBack} style={styles.header}>
      <View style={styles.body}>
        <Text style={styles.label}>{`Step ${step} of ${total} · ${label}`}</Text>
        <View
          style={styles.segments}
          accessibilityRole="progressbar"
          accessibilityLabel="Setup progress"
          accessibilityValue={{ min: 0, max: total, now: step }}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[styles.segment, i < step && styles.segmentDone]} />
          ))}
        </View>
      </View>
    </HimaHeader>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 24,
    paddingRight: 20,
    paddingBottom: 0,
    paddingLeft: 8,
  },
  body: {
    flex: 1,
  },
  label: {
    fontFamily: font.inter[600],
    fontSize: 12,
    color: colors.textSecondary,
  },
  segments: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  segmentDone: {
    backgroundColor: colors.deepSkyBlue,
  },
});
