import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, lineHeight, radius } from '@/theme';

import { Mascot } from './Mascot';
import { Text } from './Text';

type Props = {
  message: string;
  style?: StyleProp<ViewStyle>;
};

/** Pointing mascot with a speech bubble (onboarding tips). */
export function MascotTip({ message, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Mascot pose="point" height={84} />
      <View style={styles.bubble}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bubble: {
    flexShrink: 1,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopLeftRadius: radius[16],
    borderTopRightRadius: radius[16],
    borderBottomRightRadius: radius[16],
    borderBottomLeftRadius: radius[4],
    backgroundColor: colors.backgroundSecondary,
  },
  text: {
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
    color: colors.textPrimary,
  },
});
