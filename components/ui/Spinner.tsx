import { useEffect } from 'react';
import { Animated, Easing } from 'react-native';

import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReducedMotion } from '@/hooks/useReducedMotion';

import { LoaderCircle } from './icons';

type Props = {
  size: number;
  color: string;
  strokeWidth?: number;
};

/** Lucide loader-circle that spins; holds still when reduced motion is on. */
export function Spinner({ size, color, strokeWidth = 2.5 }: Props) {
  const reduced = useReducedMotion();
  const turn = useAnimatedValue(0);

  useEffect(() => {
    if (reduced) {
      turn.stopAnimation();
      turn.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(turn, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, turn]);

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{ width: size, height: size, transform: [{ rotate }] }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <LoaderCircle size={size} color={color} strokeWidth={strokeWidth} />
    </Animated.View>
  );
}
