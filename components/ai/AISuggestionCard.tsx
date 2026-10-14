import { StyleSheet, View } from 'react-native';

import { HimaButton } from '@/components/ui/HimaButton';
import { Sparkle } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { colors, font, lineHeight, radius } from '@/theme';

import { MascotAvatar } from './MascotAvatar';

type Props = {
  title: string;
  body: string;
  /** 1-based position, e.g. 1 of 2. */
  index: number;
  count: number;
  onReview: () => void;
  onNext: () => void;
};

/** 09 Insights "Hima AI suggests": one suggestion at a time; nothing changes until approved. */
export function AISuggestionCard({ title, body, index, count, onReview, onNext }: Props) {
  return (
    <View style={styles.card} accessibilityLabel="Hima AI suggestions">
      <View style={styles.head}>
        <MascotAvatar size={36} />
        <View style={styles.label}>
          <Sparkle size={14} color={colors.ai} strokeWidth={2} />
          <Text style={styles.labelText}>Hima AI suggests</Text>
        </View>
        <Text style={styles.count}>{`${index} of ${count}`}</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        <HimaButton label="Review suggestion" variant="ai" size="md" onPress={onReview} style={styles.action} />
        <HimaButton
          label="Next suggestion"
          variant="aiOutline"
          size="md"
          onPress={onNext}
          disabled={count < 2}
          style={styles.action}
        />
      </View>
      <Text style={styles.note}>Your plan only changes after you approve.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.aiBorder,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  labelText: {
    fontFamily: font.jakarta[700],
    fontSize: 13,
    color: colors.ai,
  },
  count: {
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  title: {
    marginTop: 12,
    fontFamily: font.jakarta[700],
    fontSize: 16,
    color: colors.textPrimary,
  },
  body: {
    marginTop: 4,
    fontFamily: font.inter[400],
    fontSize: 14,
    lineHeight: lineHeight(14, 1.5),
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  action: {
    flex: 1,
  },
  note: {
    marginTop: 10,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
});
