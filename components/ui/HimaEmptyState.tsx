import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, lineHeight } from '@/theme';

import { HimaButton } from './HimaButton';
import { Mascot } from './Mascot';
import { Text } from './Text';

type Props = {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

/** Waving mascot, title, short message and an optional outlined action. */
export function HimaEmptyState({ title, message, action, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <Mascot pose="wave" height={104} />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {action && (
        <HimaButton
          label={action.label}
          onPress={action.onPress}
          variant="secondary"
          size="md"
          fullWidth={false}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  title: {
    marginTop: 4,
    fontFamily: font.jakarta[700],
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    maxWidth: 300,
    fontFamily: font.inter[400],
    fontSize: 14,
    lineHeight: lineHeight(14, 1.5),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: 6,
    alignSelf: 'center',
  },
});
