import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { HimaButton } from '@/components/ui/HimaButton';
import { HimaHeader } from '@/components/ui/HimaHeader';
import { IconButton } from '@/components/ui/IconButton';
import { Check, Copy, Hourglass, Send } from '@/components/ui/icons';
import { Screen } from '@/components/ui/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { TestnetBadge } from '@/components/ui/TestnetBadge';
import { Text } from '@/components/ui/Text';
import { colors, font, layout, letterSpacing, lineHeight, radius, tabular } from '@/theme';
import { formatPeso, spokenPeso } from '@/utils/money';

import { StatusPill } from './StatusPill';

type Props = {
  /** submitting = 13b, confirming = 13c. */
  phase: 'submitting' | 'confirming';
  amount: number;
  merchantName: string;
  /** "Fingerprint · 12:05 PM". */
  authorizedDetail: string;
  /** "Tx 0x7a3f…c91e · 12:05 PM" once submitted. */
  submittedDetail?: string;
  reference: string;
  onCopyReference: () => void;
  onContinueInBackground: () => void;
};

const RING = 136;
const R = 60;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** 13b / 13c Processing. Neutral progress only: nothing reads as paid until the network confirms. */
export function ProcessingView({
  phase,
  amount,
  merchantName,
  authorizedDetail,
  submittedDetail,
  reference,
  onCopyReference,
  onContinueInBackground,
}: Props) {
  const confirming = phase === 'confirming';
  // 13b shows about a third of the ring, 13c about two thirds (132 / 377 and 264 / 377 in the design).
  const progress = confirming ? 264 / 377 : 132 / 377;
  const Icon = confirming ? Hourglass : Send;

  const steps = [
    { title: 'Authorized', detail: authorizedDetail, state: 'done' as const },
    confirming
      ? { title: 'Submitted', detail: submittedDetail ?? '', state: 'done' as const, numeric: true }
      : { title: 'Submitting to Paiflow testnet', detail: 'Sending the transaction', state: 'current' as const },
    confirming
      ? { title: 'Waiting for network confirmation', detail: 'Usually 5–15 seconds on testnet', state: 'current' as const }
      : { title: 'Network confirmation', detail: 'Up next', state: 'upcoming' as const },
  ];

  const footer = confirming ? (
    <View style={styles.footerConfirm}>
      <Text style={styles.footNoteConfirm}>You can leave this screen. We&apos;ll notify you the moment it&apos;s confirmed.</Text>
      <HimaButton label="Continue in background" variant="text" size="compact" onPress={onContinueInBackground} />
    </View>
  ) : (
    <Text style={styles.footNote}>Keep Hima open. Nothing shows as paid until the network confirms it.</Text>
  );

  return (
    <Screen footer={footer}>
      <HimaHeader leading={null} title="Processing payment" trailing={<TestnetBadge />} style={styles.header} />
      <View style={styles.main}>
        <View style={styles.ring} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Svg width={RING} height={RING}>
            <Circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke={colors.muted} strokeWidth={8} />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              fill="none"
              stroke={colors.deepSkyBlue}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Icon size={confirming ? 34 : 36} color={colors.deepSkyBlue} strokeWidth={1.8} />
          </View>
        </View>

        <StatusPill
          label={confirming ? 'Awaiting confirmation…' : 'Submitting payment…'}
          tone="blueText"
          leading="spinner"
          style={styles.pill}
        />
        <Text style={styles.amount} accessibilityLabel={spokenPeso(amount)}>
          {formatPeso(amount)}
        </Text>
        <Text style={styles.to}>{`to ${merchantName}`}</Text>

        <View style={styles.steps} accessibilityLabel="Payment progress">
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            // The line into "submitting" is green once authorized; the line into network
            // confirmation stays grey until the network actually confirms (as in 13b and 13c).
            const connector = i === 0 ? colors.safe : colors.border;
            return (
              <View
                key={s.title}
                style={styles.step}
                accessible
                accessibilityLabel={`${s.title}. ${s.detail}. ${s.state === 'done' ? 'Done' : s.state === 'current' ? 'In progress' : 'Not started'}`}>
                <View style={styles.markerCol}>
                  <View
                    style={[
                      styles.marker,
                      s.state === 'done' && styles.markerDone,
                      s.state === 'current' && styles.markerCurrent,
                      s.state === 'upcoming' && styles.markerUpcoming,
                    ]}>
                    {s.state === 'done' && <Check size={13} color={colors.white} strokeWidth={3.5} />}
                    {s.state === 'current' && <Spinner size={12} color={colors.deepSkyBlue} strokeWidth={3.5} />}
                  </View>
                  {!last && <View style={[styles.connector, { backgroundColor: connector }]} />}
                </View>
                <View style={[styles.stepText, !last && styles.stepTextSpaced]}>
                  <Text
                    style={[
                      styles.stepTitle,
                      s.state === 'current' && styles.stepTitleCurrent,
                      s.state === 'upcoming' && styles.stepTitleUpcoming,
                    ]}>
                    {s.title}
                  </Text>
                  <Text style={[styles.stepDetail, 'numeric' in s && s.numeric && tabular]}>{s.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.reference}>
          <Text style={styles.referenceText}>
            {'Reference '}
            <Text style={styles.referenceValue}>{reference}</Text>
          </Text>
          <IconButton icon={Copy} accessibilityLabel="Copy reference" color={colors.deepSkyBlue} iconSize={18} onPress={onCopyReference} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 24,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 20,
    // Content-box in the design: 44 min-height plus 24 + 8 padding.
    minHeight: 76,
    justifyContent: 'space-between',
  },
  main: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: layout.screenPadding,
  },
  ring: {
    width: RING,
    height: RING,
  },
  ringCenter: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    marginTop: 24,
  },
  amount: {
    marginTop: 14,
    fontFamily: font.jakarta[800],
    fontSize: 28,
    letterSpacing: letterSpacing(28, -0.01),
    color: colors.textPrimary,
    ...tabular,
  },
  to: {
    marginTop: 4,
    fontFamily: font.inter[400],
    fontSize: 15,
    color: colors.textSecondary,
  },
  steps: {
    alignSelf: 'stretch',
    marginTop: 24,
    padding: 16,
    borderRadius: radius[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  markerCol: {
    alignItems: 'center',
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: {
    backgroundColor: colors.safe,
  },
  markerCurrent: {
    borderWidth: 2,
    borderColor: colors.deepSkyBlue,
    backgroundColor: colors.white,
  },
  markerUpcoming: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 18,
  },
  stepText: {
    flex: 1,
  },
  stepTextSpaced: {
    paddingBottom: 14,
  },
  stepTitle: {
    marginTop: 2,
    fontFamily: font.jakarta[700],
    fontSize: 15,
    color: colors.textPrimary,
  },
  stepTitleCurrent: {
    color: colors.deepSkyBlue,
  },
  stepTitleUpcoming: {
    fontFamily: font.jakarta[600],
    color: colors.textSecondary,
  },
  stepDetail: {
    marginTop: 2,
    fontFamily: font.inter[400],
    fontSize: 12,
    color: colors.textSecondary,
  },
  reference: {
    alignSelf: 'stretch',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 16,
    borderRadius: radius[16],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referenceText: {
    fontFamily: font.inter[400],
    fontSize: 13,
    color: colors.textSecondary,
  },
  referenceValue: {
    fontFamily: font.inter[600],
    color: colors.textPrimary,
    ...tabular,
  },
  footNote: {
    paddingTop: 16,
    paddingHorizontal: 32,
    paddingBottom: 32,
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerConfirm: {
    paddingTop: 12,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 4,
  },
  footNoteConfirm: {
    paddingHorizontal: 12,
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
