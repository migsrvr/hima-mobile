import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Sparkle, Sparkles } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { colors, font } from '@/theme';

type Props = {
  /** 07 Home draws the sparkle with its small plus; elsewhere it is the single star. */
  icon?: 'sparkle' | 'sparkles';
  style?: StyleProp<ViewStyle>;
};

/** "Hima AI" in AI purple. Every piece of AI content carries this tag. */
export function AILabel({ icon = 'sparkle', style }: Props) {
  const Icon = icon === 'sparkles' ? Sparkles : Sparkle;
  return (
    <View style={[styles.row, style]}>
      <Icon size={14} color={colors.ai} strokeWidth={2} />
      <Text style={styles.label}>Hima AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  label: {
    fontFamily: font.jakarta[700],
    fontSize: 13,
    color: colors.ai,
  },
});
