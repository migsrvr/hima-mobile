import { StyleSheet, View } from 'react-native';

import { ShieldCheck, Sparkle } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import type { CalculatedRow } from '@/services/ai';
import { colors, font, lineHeight, radius, tabular } from '@/theme';

/** The student's message: right-aligned, Deep Sky Blue. */
export function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userWrap}>
      <View style={styles.user} accessible accessibilityLabel={`You: ${text}`}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    </View>
  );
}

type AIProps = {
  text: string;
  /** Figures from the wallet calculations, never from the model. */
  calculated?: CalculatedRow[];
};

/** Hima AI's answer: tagged "Hima AI"; numbers sit in the "Calculated from your wallet" box. */
export function AIChatBubble({ text, calculated }: AIProps) {
  // CSS sizes the bubble to the available 88% once the text wraps; React Native would shrink it
  // to the longest line. Wrapping answers and answers with figures take the full 88%.
  const wide = (calculated?.length ?? 0) > 0 || text.length > 48;
  const spoken = calculated?.map((r) => `${r.label}: ${r.value}`).join('. ');
  return (
    <View style={[styles.aiWrap, wide && styles.aiWide]}>
      <View style={styles.ai}>
        <View style={styles.aiLabel} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Sparkle size={12} color={colors.ai} strokeWidth={2} />
          <Text style={styles.aiLabelText}>Hima AI</Text>
        </View>
        <Text style={styles.aiText} accessibilityLabel={`Hima AI: ${text}`}>
          {text}
        </Text>
        {calculated && calculated.length > 0 && (
          <View style={styles.calc} accessible accessibilityLabel={`Calculated from your wallet. ${spoken}`}>
            <View style={styles.calcTitle}>
              <ShieldCheck size={12} color={colors.safeText} strokeWidth={2.2} />
              <Text style={styles.calcTitleText}>Calculated from your wallet</Text>
            </View>
            {calculated.map((r) => (
              <View key={r.label} style={styles.calcRow}>
                <Text style={styles.calcLabel}>{r.label}</Text>
                <Text style={styles.calcValue}>{r.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/** While Hima AI works out an answer. */
export function ThinkingBubble() {
  return (
    <View style={[styles.ai, styles.thinking]} accessibilityLiveRegion="polite" accessibilityLabel="Hima AI is checking your wallet">
      <Spinner size={14} color={colors.ai} strokeWidth={2.5} />
      <Text style={styles.thinkingText}>Checking your wallet…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // CSS max-width counts only the content box, so the design's bubbles are 78% / 88% wide
  // plus their padding and border. The wrapper takes the percentage; the bubble extends past it.
  userWrap: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
  },
  user: {
    marginLeft: -28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: radius[4],
    borderBottomLeftRadius: 18,
    backgroundColor: colors.deepSkyBlue,
  },
  userText: {
    fontFamily: font.inter[400],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.4),
    color: colors.white,
  },
  aiWrap: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
  },
  ai: {
    marginRight: -30,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopLeftRadius: radius[4],
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.aiBorder,
  },
  aiWide: {
    width: '88%',
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiLabelText: {
    fontFamily: font.jakarta[700],
    fontSize: 12,
    color: colors.ai,
  },
  aiText: {
    marginTop: 4,
    fontFamily: font.inter[400],
    fontSize: 14,
    lineHeight: lineHeight(14, 1.5),
    color: colors.textPrimary,
  },
  calc: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius[12],
    backgroundColor: colors.background,
  },
  calcTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  calcTitleText: {
    fontFamily: font.inter[700],
    fontSize: 11,
    color: colors.safeText,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  calcLabel: {
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.6),
    color: colors.textSecondary,
    ...tabular,
  },
  calcValue: {
    fontFamily: font.inter[600],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.6),
    color: colors.textPrimary,
    ...tabular,
  },
  thinking: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textSecondary,
  },
});
