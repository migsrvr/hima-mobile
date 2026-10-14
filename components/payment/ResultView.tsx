import * as Haptics from 'expo-haptics';
import { useEffect, type ReactNode } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HimaButton } from '@/components/ui/HimaButton';
import { HimaHeader } from '@/components/ui/HimaHeader';
import { Check, CircleX, Clock, ExternalLink, Info, RefreshCw, ShieldCheck } from '@/components/ui/icons';
import { Mascot } from '@/components/ui/Mascot';
import { Screen } from '@/components/ui/Screen';
import { TestnetBadge } from '@/components/ui/TestnetBadge';
import { Text } from '@/components/ui/Text';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, font, layout, letterSpacing, lineHeight, radius, tabular } from '@/theme';
import { formatPeso, spokenPeso } from '@/utils/money';

import { DetailRows, type DetailRow } from './DetailRows';
import { StatusPill } from './StatusPill';

type Props = {
  outcome: 'confirmed' | 'pending' | 'failed';
  amount: number;
  merchantName: string;
  rows: DetailRow[];
  /** Green (confirmed) or blue (pending) note under the details. Never shown on failure. */
  note?: string;
  checking?: boolean;
  onHome: () => void;
  onExplorer: () => void;
  onCheckStatus: () => void;
  onTryAgain: () => void;
};

/** 14a–14c Payment result. Success only ever appears after network confirmation. */
export function ResultView({ outcome, amount, merchantName, rows, note, checking, onHome, onExplorer, onCheckStatus, onTryAgain }: Props) {
  const confirmed = outcome === 'confirmed';
  const pending = outcome === 'pending';

  let footer: ReactNode;
  if (confirmed) {
    footer = (
      <View style={styles.footer}>
        <HimaButton label="Back to Home" onPress={onHome} testID="result-home" />
        <HimaButton label="View on explorer" variant="secondary" icon={ExternalLink} iconSize={16} iconPosition="end" onPress={onExplorer} />
      </View>
    );
  } else if (pending) {
    footer = (
      <View style={styles.footer}>
        <HimaButton label={checking ? 'Checking…' : 'Check status'} icon={RefreshCw} iconSize={18} loading={checking} onPress={onCheckStatus} />
        <HimaButton label="Back to Home" variant="secondary" onPress={onHome} />
      </View>
    );
  } else {
    footer = (
      <View style={styles.footer}>
        <HimaButton label="Try again" icon={RefreshCw} iconSize={18} onPress={onTryAgain} />
        <HimaButton label="Back to Home" variant="secondary" onPress={onHome} />
      </View>
    );
  }

  return (
    <Screen footer={footer} edges={confirmed ? ['bottom'] : ['top', 'bottom']}>
      {confirmed ? (
        <Celebration />
      ) : (
        <HimaHeader leading="close" onLeadingPress={onHome} trailing={<TestnetBadge />} style={styles.header} />
      )}
      <View style={[styles.main, confirmed ? styles.mainConfirmed : styles.mainOther]}>
        {pending && (
          <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
            <Clock size={44} color={colors.textPrimary} strokeWidth={1.8} />
          </View>
        )}
        {outcome === 'failed' && (
          <View style={styles.failedRing}>
            <View style={styles.failedCenter}>
              <CircleX size={40} color={colors.dangerText} strokeWidth={1.8} />
            </View>
          </View>
        )}

        {confirmed && <StatusPill label="Confirmed on testnet" tone="safe" leading={Check} iconStrokeWidth={2.5} />}
        {pending && <StatusPill label="Pending" tone="neutral" leading={Clock} style={styles.pill18} />}
        {outcome === 'failed' && <StatusPill label="Failed · not charged" tone="danger" leading={CircleX} style={styles.pill16} />}

        <Text style={styles.title} accessibilityRole="header">
          {confirmed ? 'Payment confirmed' : pending ? 'Payment pending' : 'Payment failed'}
        </Text>
        <Text
          style={[styles.amount, outcome === 'failed' && styles.amountStruck]}
          accessibilityLabel={`${spokenPeso(amount)}${outcome === 'failed' ? ', not charged' : ''}`}>
          {formatPeso(amount)}
        </Text>
        <Text style={styles.to}>{`${confirmed ? 'paid to' : 'to'} ${merchantName}`}</Text>

        {pending && (
          <Text style={styles.message}>
            The network hasn&apos;t confirmed this yet. Your money is on hold, not lost.{' '}
            <Text style={styles.strong}>Please don&apos;t pay again.</Text> We&apos;ll notify you as soon as it settles.
          </Text>
        )}
        {outcome === 'failed' && (
          <Text style={styles.message}>
            {/* The design says "in time"; real failures also include refusals, so the reason row says why. */}
            The testnet didn&apos;t confirm this payment, so it was cancelled.{' '}
            <Text style={styles.strong}>No money left your wallet.</Text>
          </Text>
        )}

        <DetailRows
          rows={rows}
          accessibilityLabel={confirmed ? 'Receipt' : 'Payment details'}
          style={confirmed ? styles.receiptConfirmed : styles.receiptOther}
        />

        {note != null && (confirmed || pending) && (
          <View style={[styles.note, confirmed ? styles.noteSafe : styles.noteBlue]}>
            {confirmed ? (
              <ShieldCheck size={18} color={colors.safeText} strokeWidth={2} style={styles.noteIcon} />
            ) : (
              <Info size={18} color={colors.blueText} strokeWidth={2} style={styles.noteIcon} />
            )}
            <Text style={[styles.noteText, { color: confirmed ? colors.safeText : colors.blueText }]}>{note}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

/** Confirmed-only header: sky panel, a few confetti dots and the rocket-hug mascot. */
function Celebration() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const pop = useAnimatedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (reduced) {
      pop.setValue(1);
      return;
    }
    Animated.timing(pop, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start();
  }, [reduced, pop]);

  return (
    <View style={[styles.hero, { height: 200 + insets.top, paddingTop: insets.top }]}>
      <View style={[styles.confetti, { left: 48, top: 54 + insets.top, width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.rocketYellow }]} />
      <View style={[styles.confetti, { left: 82, top: 112 + insets.top, width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.skyBlue }]} />
      <View style={[styles.confetti, { right: 52, top: 44 + insets.top, width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.skyBlue }]} />
      <View
        style={[
          styles.confetti,
          { right: 70, top: 104 + insets.top, width: 12, height: 12, borderRadius: radius[3], backgroundColor: colors.rocketYellow, transform: [{ rotate: '20deg' }] },
        ]}
      />
      <View
        style={[
          styles.confetti,
          { left: 120, top: 30 + insets.top, width: 6, height: 6, borderRadius: radius[2], backgroundColor: colors.safe, transform: [{ rotate: '35deg' }] },
        ]}
      />
      <Animated.View style={{ opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
        <Mascot pose="hug" height={178} accessibilityLabel="Hima hugging the golden rocket in celebration" style={styles.mascot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
  },
  mascot: {
    marginBottom: -4,
  },
  header: {
    justifyContent: 'space-between',
  },
  main: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  mainConfirmed: {
    paddingTop: 18,
  },
  mainOther: {
    paddingTop: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedRing: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.dangerTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedCenter: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill18: {
    marginTop: 18,
  },
  pill16: {
    marginTop: 16,
  },
  title: {
    marginTop: 10,
    fontFamily: font.jakarta[800],
    fontSize: 26,
    lineHeight: lineHeight(26, 1.25),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  amount: {
    marginTop: 4,
    fontFamily: font.jakarta[800],
    fontSize: 40,
    lineHeight: lineHeight(40, 1.15),
    letterSpacing: letterSpacing(40, -0.02),
    color: colors.textPrimary,
    ...tabular,
  },
  amountStruck: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  to: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 15,
    color: colors.textSecondary,
  },
  message: {
    marginTop: 14,
    fontFamily: font.inter[400],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.5),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  strong: {
    fontFamily: font.inter[600],
  },
  receiptConfirmed: {
    marginTop: 14,
  },
  receiptOther: {
    marginTop: 16,
  },
  note: {
    alignSelf: 'stretch',
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius[16],
  },
  noteSafe: {
    backgroundColor: colors.safeTint,
  },
  noteBlue: {
    backgroundColor: colors.backgroundSecondary,
  },
  noteIcon: {
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontFamily: font.inter[500],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
    gap: 8,
  },
});
