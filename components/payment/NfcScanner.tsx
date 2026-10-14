import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Ban, Check, CircleQuestionMark, Nfc, SmartphoneNfc, Store, Timer, X, type LucideIcon } from '@/components/ui/icons';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius, shadow } from '@/theme';

export type ScannerVisual = 'ready' | 'scanning' | 'recognized' | 'unknown' | 'unsupported' | 'disabled' | 'timeout';

type Ring = { inset: number; stroke?: string; fill?: string; dashed?: boolean };
type Spec = {
  size: number;
  rings: Ring[];
  center: number;
  centerBg: string;
  centerBorder?: string;
  centerShadow?: string;
  icon: LucideIcon;
  iconSize: number;
  iconColor: string;
  badge?: { bg: string; icon: LucideIcon; iconSize: number; bottom: number };
};

/** Ring layouts copied from 11a–11g. */
const SPECS: Record<ScannerVisual, Spec> = {
  ready: {
    size: 240,
    rings: [
      { inset: 0, stroke: colors.skyBlueA16 },
      { inset: 32, stroke: colors.skyBlueA28 },
      { inset: 64, fill: colors.skyBlueA10 },
    ],
    center: 104,
    centerBg: colors.white,
    centerBorder: colors.border,
    centerShadow: shadow.nfcIcon,
    icon: SmartphoneNfc,
    iconSize: 46,
    iconColor: colors.deepSkyBlue,
  },
  scanning: {
    size: 240,
    rings: [
      { inset: 0, stroke: colors.skyBlueA30, fill: colors.skyBlueA08 },
      { inset: 32, stroke: colors.skyBlueA50, fill: colors.skyBlueA12 },
      { inset: 64, fill: colors.skyBlueA20 },
    ],
    center: 104,
    centerBg: colors.deepSkyBlue,
    centerShadow: shadow.nfcActive,
    icon: Nfc,
    iconSize: 46,
    iconColor: colors.white,
  },
  recognized: {
    size: 240,
    rings: [
      { inset: 0, stroke: colors.safeTint },
      { inset: 32, stroke: colors.safeBorder },
      { inset: 64, fill: colors.safeTint },
    ],
    center: 104,
    centerBg: colors.white,
    centerBorder: colors.safeBorder,
    centerShadow: shadow.safeIcon,
    icon: Store,
    iconSize: 44,
    iconColor: colors.safeText,
    badge: { bg: colors.safe, icon: Check, iconSize: 14, bottom: 4 },
  },
  unknown: {
    size: 240,
    rings: [
      { inset: 0, stroke: colors.border, dashed: true },
      { inset: 32, stroke: colors.border, dashed: true },
      { inset: 64, fill: colors.yellowTint },
    ],
    center: 104,
    centerBg: colors.white,
    centerBorder: colors.yellowBorder,
    icon: CircleQuestionMark,
    iconSize: 44,
    iconColor: colors.warningText,
  },
  unsupported: {
    size: 240,
    rings: [
      { inset: 0, stroke: colors.border, dashed: true },
      { inset: 32, stroke: colors.border, dashed: true },
      { inset: 64, fill: colors.muted },
    ],
    center: 104,
    centerBg: colors.white,
    centerBorder: colors.border,
    icon: Ban,
    iconSize: 44,
    iconColor: colors.textSecondary,
  },
  disabled: {
    size: 200,
    rings: [
      { inset: 0, stroke: colors.border, dashed: true },
      { inset: 36, fill: colors.muted },
    ],
    center: 96,
    centerBg: colors.white,
    centerBorder: colors.border,
    icon: SmartphoneNfc,
    iconSize: 42,
    iconColor: colors.textSecondary,
    badge: { bg: colors.navy, icon: X, iconSize: 12, bottom: 2 },
  },
  timeout: {
    size: 240,
    rings: [
      { inset: 0, stroke: colors.border, dashed: true },
      { inset: 32, stroke: colors.border, dashed: true },
      { inset: 64, fill: colors.muted },
    ],
    center: 104,
    centerBg: colors.white,
    centerBorder: colors.border,
    icon: Timer,
    iconSize: 44,
    iconColor: colors.textPrimary,
  },
};

/** Dash pattern Chrome uses for a 2 px dashed circle: 6 px dashes, evenly spread around. */
function dashFor(r: number): string {
  const c = 2 * Math.PI * r;
  const n = Math.max(1, Math.round(c / 10.5));
  return `6 ${c / n - 6}`;
}

/** 11a–11g scanner illustration. Decorative: the status pill and headline carry the meaning. */
export function NfcScanner({ visual }: { visual: ScannerVisual }) {
  const s = SPECS[visual];
  const reduced = useReducedMotion();
  const pulse = useAnimatedValue(0);
  const animate = visual === 'scanning' && !reduced;

  useEffect(() => {
    if (!animate) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, pulse]);

  const half = s.size / 2;
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.75] });
  const Icon = s.icon;

  return (
    <View
      style={{ width: s.size, height: s.size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}>
        <Svg width={s.size} height={s.size}>
          {s.rings.map((ring) => {
            const r = half - ring.inset - (ring.stroke ? 1 : 0);
            return (
              <Circle
                key={ring.inset}
                cx={half}
                cy={half}
                r={r}
                fill={ring.fill ?? 'none'}
                stroke={ring.stroke ?? 'none'}
                strokeWidth={ring.stroke ? 2 : 0}
                strokeDasharray={ring.dashed ? dashFor(r) : undefined}
              />
            );
          })}
        </Svg>
      </Animated.View>
      <View
        style={[
          styles.center,
          { width: s.center, height: s.center, backgroundColor: s.centerBg },
          s.centerBorder != null && { borderWidth: 1, borderColor: s.centerBorder },
          s.centerShadow != null && { boxShadow: s.centerShadow },
        ]}>
        <Icon size={s.iconSize} color={s.iconColor} strokeWidth={1.8} />
        {s.badge && (
          <View style={[styles.badge, { backgroundColor: s.badge.bg, bottom: s.badge.bottom }]}>
            <s.badge.icon size={s.badge.iconSize} color={colors.white} strokeWidth={3.5} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -2,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
