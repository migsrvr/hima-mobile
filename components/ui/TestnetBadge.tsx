import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, letterSpacing, radius } from '@/theme';

import { Text } from './Text';

type Props = {
  /** `solid` = navy chip in headers; `onHero` = translucent chip on the blue Safe-to-Spend card. */
  variant?: 'solid' | 'onHero';
  style?: StyleProp<ViewStyle>;
};

/** Always visible wherever money moves: payments run on the Paiflow testnet. */
export function TestnetBadge({ variant = 'solid', style }: Props) {
  return (
    <View
      style={[styles.badge, variant === 'onHero' ? styles.onHero : styles.solid, style]}
      accessible
      accessibilityLabel="Testnet: payments use test funds">
      <View style={styles.dot} />
      <Text style={styles.label}>TESTNET</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  solid: {
    backgroundColor: colors.navy,
  },
  onHero: {
    backgroundColor: colors.heroChip,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.rocketYellow,
  },
  label: {
    fontFamily: font.jakarta[700],
    fontSize: 11,
    letterSpacing: letterSpacing(11, 0.06),
    color: colors.white,
  },
});
