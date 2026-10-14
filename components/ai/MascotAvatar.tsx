import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { mascot } from '@/assets';
import { colors, radius, shadow } from '@/theme';

type Props = {
  /** 36 (Insights), 40 (cards, chat), 44 (onboarding tip), 96 (AI offline). */
  size?: number;
  /** Circle fill behind the face: Secondary background (default) or white (04 Schedule tip). */
  background?: 'secondary' | 'white';
  /** White + lavender double ring (10 Hima AI header). */
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Hima's face in a circle: the AI avatar. Decorative. */
export function MascotAvatar({ size = 40, background = 'secondary', ring = false, style }: Props) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          backgroundColor: background === 'white' ? colors.white : colors.backgroundSecondary,
        },
        ring && styles.ring,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Image source={mascot.face} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    flexShrink: 0,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  ring: {
    boxShadow: shadow.aiAvatarRing,
    overflow: 'visible',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
  },
});
