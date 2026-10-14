import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { HimaButton } from '@/components/ui/HimaButton';
import { Text } from '@/components/ui/Text';
import { colors, font, lineHeight, radius } from '@/theme';

import { AILabel } from './AILabel';
import { MascotAvatar } from './MascotAvatar';

type Action = { label: string; onPress: () => void };

type Props = {
  /**
   * The observation. Peso figures inside it must come from backend
   * calculations (services/), never from the model; wrap them in <AIStrong>.
   */
  message: ReactNode;
  /** Source line under the message ("Based on your last 4 Wednesdays"). */
  footnote?: string;
  primaryAction: Action;
  secondaryAction?: Action;
  labelIcon?: 'sparkle' | 'sparkles';
  style?: StyleProp<ViewStyle>;
};

/** Hima AI observation: avatar, "Hima AI · Powered by Groq", message, two actions. */
export function AIInsightCard({ message, footnote, primaryAction, secondaryAction, labelIcon, style }: Props) {
  return (
    <View style={[styles.card, style]} accessibilityLabel="Hima AI insight">
      <View style={styles.header}>
        <MascotAvatar size={40} />
        <View style={styles.titles}>
          <AILabel icon={labelIcon} style={styles.labelLine} />
          <Text style={styles.poweredBy}>Powered by Groq</Text>
        </View>
      </View>
      <View>
        <Text style={styles.message}>{message}</Text>
        {footnote != null && <Text style={styles.footnote}>{footnote}</Text>}
      </View>
      <View style={styles.actions}>
        <HimaButton
          label={primaryAction.label}
          onPress={primaryAction.onPress}
          variant="ai"
          size="md"
          style={styles.action}
        />
        {secondaryAction && (
          <HimaButton
            label={secondaryAction.label}
            onPress={secondaryAction.onPress}
            variant="aiOutline"
            size="md"
            style={styles.action}
          />
        )}
      </View>
    </View>
  );
}

/** Semibold span inside an AI message. */
export function AIStrong({ children }: { children: ReactNode }) {
  return <Text style={styles.strong}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.aiBorder,
    borderRadius: radius[20],
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  labelLine: {
    // Inline-flex label in a block: the browser's 21 px line box puts it 2 below the top, 3 above the next line.
    paddingTop: 2,
    paddingBottom: 3,
  },
  poweredBy: {
    marginTop: 1,
    fontFamily: font.inter[400],
    fontSize: 11,
    color: colors.textSecondary,
  },
  message: {
    fontFamily: font.inter[400],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.5),
    color: colors.textPrimary,
  },
  strong: {
    fontFamily: font.inter[600],
  },
  footnote: {
    marginTop: 6,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
  },
});
