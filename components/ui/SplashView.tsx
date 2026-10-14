import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Animated, Easing, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { illustrations, mascotSize } from '@/assets';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, font, letterSpacing, radius } from '@/theme';

import { Mascot } from './Mascot';
import { Text } from './Text';

/** Design frame height the splash positions are measured against. */
const FRAME_HEIGHT = 800;
const BAR_WIDTH = 120;
const FILL_SHARE = 0.45;

/** 01 Splash artwork: sky, rocket mascot, wordmark, tagline and a slim loading bar. */
export function SplashView() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // On screens shorter than the 800 dp frame, shrink the mascot so it never meets the wordmark.
  const scale = Math.min(1, (height - insets.top - insets.bottom) / FRAME_HEIGHT);
  const mascotWidth = 300 * scale;
  const { width: w, height: h } = mascotSize.rocket;

  return (
    <View style={styles.root}>
      <Image source={illustrations.skyClouds} style={styles.sky} resizeMode="cover" />
      <LinearGradient
        colors={[colors.splashFadeStart, colors.splashFadeMid, colors.background]}
        locations={[0, 0.45, 1]}
        style={[styles.fade, { height: 360 + insets.bottom }]}
      />
      <View style={[styles.mascotWrap, { top: insets.top + 128 * scale }]}>
        <Mascot pose="rocket" height={(mascotWidth * h) / w} accessibilityLabel="Hima the tiger riding a golden rocket" />
      </View>
      <View style={[styles.brand, { bottom: insets.bottom + 72 }]}>
        <Text style={styles.wordmark} accessibilityRole="header">
          Hima
        </Text>
        <Text style={styles.tagline}>Your allowance, made smarter.</Text>
        <LoadingBar />
      </View>
    </View>
  );
}

/** Slim indeterminate bar. Holds still at the design's 45% when reduced motion is on. */
function LoadingBar() {
  const reduced = useReducedMotion();
  const x = useAnimatedValue(0);

  useEffect(() => {
    if (reduced) {
      x.stopAnimation();
      x.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_WIDTH * (1 - FILL_SHARE)] });

  return (
    <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel="Loading Hima">
      <Animated.View style={[styles.fill, { transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.skyBlue,
    overflow: 'hidden',
  },
  sky: {
    // Static images default to their pixel size; pin the photo to the screen and crop with cover.
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  mascotWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  brand: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  wordmark: {
    fontFamily: font.jakarta[800],
    fontSize: 60,
    lineHeight: 60,
    letterSpacing: letterSpacing(60, -0.03),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 12,
    fontFamily: font.jakarta[600],
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  track: {
    width: BAR_WIDTH,
    height: 4,
    marginTop: 32,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    width: `${FILL_SHARE * 100}%`,
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.deepSkyBlue,
  },
});
