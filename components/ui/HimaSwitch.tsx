import { useEffect } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius, shadow } from '@/theme';

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Spoken name ("AI suggestions"). */
  accessibilityLabel: string;
  /** Track color when on: Deep Sky Blue, or AI purple for the Hima AI switch. */
  tone?: 'blue' | 'ai';
};

const TRAVEL = 48 - 22 - 6;

/** 48 × 28 switch inside a 60 × 44 touch target (15 Profile). */
export function HimaSwitch({ value, onValueChange, accessibilityLabel, tone = 'blue' }: Props) {
  const reduced = useReducedMotion();
  const position = useAnimatedValue(value ? 1 : 0);

  useEffect(() => {
    Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: reduced ? 0 : 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [value, reduced, position]);

  const onColor = tone === 'ai' ? colors.ai : colors.deepSkyBlue;
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      style={styles.target}>
      <View style={[styles.track, { backgroundColor: value ? onColor : colors.border }]}>
        <Animated.View
          style={[styles.thumb, { transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }) }] }]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    width: 60,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 48,
    height: 28,
    padding: 3,
    borderRadius: radius.full,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    boxShadow: shadow.thumb,
  },
});
