import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * A stable Animated.Value for the component's lifetime.
 * (react-native's own useAnimatedValue isn't available on react-native-web.)
 */
export function useAnimatedValue(initial: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initial));
  return value;
}
