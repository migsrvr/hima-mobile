import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { HimaButton } from '@/components/ui/HimaButton';
import { HimaHeader } from '@/components/ui/HimaHeader';
import { Ban, Check, CircleAlert, Clock, ExternalLink, Info, RefreshCw, TriangleAlert } from '@/components/ui/icons';
import { Screen } from '@/components/ui/Screen';
import { TestnetBadge } from '@/components/ui/TestnetBadge';
import { Text } from '@/components/ui/Text';
import { categoryVisuals } from '@/components/finance/categoryVisuals';
import type { Merchant } from '@/services/payments/merchants';
import { maskTagId } from '@/services/payments/merchants';
import { colors, font, layout, lineHeight, radius, tabular } from '@/theme';

import { DetailRows } from './DetailRows';
import { NfcScanner, type ScannerVisual } from './NfcScanner';
import { StatusPill } from './StatusPill';

export type NfcScreenState = ScannerVisual | 'noNfc';

type Props = {
  state: NfcScreenState;
  tagId?: string;
  merchant?: Merchant;
  /** "Today's food plan" / "₱150.00 left" (11c). */
  planLeft?: { label: string; value: string };
  onClose: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
};

/** 11a–11g Tap to Pay scanner. */
export function NfcScanView({ state, tagId, merchant, planLeft, onClose, onContinue, onRetry, onOpenSettings }: Props) {
  const header = (
    <HimaHeader leading="close" onLeadingPress={onClose} title="Tap to Pay" trailing={<TestnetBadge />} />
  );
  const cancel = (label = 'Cancel', variant: 'secondary' | 'text' = 'text') => (
    <HimaButton label={label} variant={variant} size={variant === 'text' ? 'compact' : 'lg'} onPress={onClose} />
  );

  let body: ReactNode;
  let footer: ReactNode;
  let mainStyle = styles.main24;

  switch (state) {
    case 'ready':
      body = (
        <>
          <NfcScanner visual="ready" />
          <StatusPill label="Ready to scan" tone="blueText" leading="dot" style={styles.pill28} />
          <Headline title="Hold your phone near the merchant tag" body="Touch the top of your phone to the tag and keep it still for a moment." />
        </>
      );
      footer = (
        <View style={[styles.footer, styles.footerGap12]}>
          <View style={styles.demo}>
            <Info size={18} color={colors.deepSkyBlue} strokeWidth={2} style={styles.demoIcon} />
            <Text style={styles.demoText}>
              <Text style={styles.strong}>Demo mode:</Text> the registered student ID stands in for a merchant tag. Hima only reads its
              ID, never writes to the card, and charges nothing until you confirm.
            </Text>
          </View>
          {cancel('Cancel', 'secondary')}
        </View>
      );
      break;
    case 'scanning':
      body = (
        <>
          <NfcScanner visual="scanning" />
          <StatusPill label="Scanning…" tone="blueText" leading="spinner" style={styles.pill28} />
          <Headline title="Reading the tag" body="Keep your phone still. This only takes a second." />
        </>
      );
      footer = <View style={[styles.footer, styles.footerGap12]}>{cancel('Cancel', 'secondary')}</View>;
      break;
    case 'recognized':
      mainStyle = styles.main20;
      body = (
        <>
          <NfcScanner visual="recognized" />
          <StatusPill label="Merchant recognized" tone="safe" leading={Check} iconStrokeWidth={2.5} style={styles.pill24} />
          <Text style={styles.merchant} accessibilityRole="header">
            {merchant?.name}
          </Text>
          <Text style={styles.merchantSub}>
            {merchant ? `${categoryVisuals[merchant.category].label} · Verified Hima merchant` : ''}
          </Text>
          <DetailRows
            variant="scan"
            style={styles.details}
            rows={[
              { label: 'Tag ID', value: tagId ? maskTagId(tagId) : '', numeric: true },
              ...(planLeft ? [{ label: planLeft.label, value: planLeft.value, numeric: true }] : []),
            ]}
          />
        </>
      );
      footer = (
        <View style={[styles.footer, styles.footerGap8]}>
          <Text style={styles.footNote}>You&apos;ll review the amount next. Nothing is charged yet.</Text>
          <HimaButton label="Continue to checkout" onPress={onContinue} testID="scan-continue" />
          {cancel()}
        </View>
      );
      break;
    case 'unknown':
      body = (
        <>
          <NfcScanner visual="unknown" />
          <StatusPill label="Unknown tag" tone="yellow" leading={TriangleAlert} style={styles.pill28} />
          <Headline
            title="We don't recognize this tag"
            body="It isn't linked to a Hima merchant. Ask the cashier for their Hima tag, then try again."
          />
          {tagId && <Text style={styles.tagNote}>{`Tag ID ${maskTagId(tagId)} · nothing charged`}</Text>}
        </>
      );
      footer = (
        <View style={[styles.footer, styles.footerGap8]}>
          <HimaButton label="Try again" onPress={onRetry} />
          {cancel()}
        </View>
      );
      break;
    case 'unsupported':
      body = (
        <>
          <NfcScanner visual="unsupported" />
          <StatusPill label="Unsupported tag" tone="neutral" leading={Ban} style={styles.pill28} />
          <Headline
            title="This card can't be used here"
            body="It looks like a bank or transit card. Hima only reads merchant tags, so nothing was read or charged."
          />
        </>
      );
      footer = (
        <View style={[styles.footer, styles.footerGap8]}>
          <HimaButton label="Try another tag" onPress={onRetry} />
          {cancel()}
        </View>
      );
      break;
    case 'disabled':
      mainStyle = styles.main20;
      body = (
        <>
          <NfcScanner visual="disabled" />
          <StatusPill label="NFC is off" tone="neutral" leading={CircleAlert} style={styles.pill24} />
          <Headline title="Turn on NFC to pay" body="Tap to Pay uses your phone's NFC. It only takes a moment to switch on." />
          <View style={styles.steps} accessibilityRole="list">
            {[
              <Text key="1" style={styles.stepText}>Open NFC settings below</Text>,
              <Text key="2" style={styles.stepText}>
                Switch on <Text style={styles.strong}>NFC</Text>
              </Text>,
              <Text key="3" style={styles.stepText}>Come back. Scanning restarts by itself.</Text>,
            ].map((text, i, all) => (
              <View key={i} style={[styles.step, i < all.length - 1 && styles.stepDivider]}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                {text}
              </View>
            ))}
          </View>
        </>
      );
      footer = (
        <View style={[styles.footer, styles.footerGap8]}>
          <HimaButton label="Open NFC settings" icon={ExternalLink} iconSize={18} iconPosition="end" onPress={onOpenSettings} />
          <HimaButton label="Not now" variant="text" size="compact" onPress={onClose} />
        </View>
      );
      break;
    case 'timeout':
      body = (
        <>
          <NfcScanner visual="timeout" />
          <StatusPill label="Timed out" tone="neutral" leading={Clock} style={styles.pill28} />
          <Headline
            title="No tag found"
            body="Scanning stopped after 30 seconds. Hold the top of your phone flat against the tag, then scan again."
          />
        </>
      );
      footer = (
        <View style={[styles.footer, styles.footerGap8]}>
          <HimaButton label="Scan again" icon={RefreshCw} iconSize={18} onPress={onRetry} />
          {cancel()}
        </View>
      );
      break;
    case 'noNfc':
      body = (
        <>
          <NfcScanner visual="unsupported" />
          <StatusPill label="NFC not available" tone="neutral" leading={Ban} style={styles.pill28} />
          <Headline
            title="This phone can't scan tags"
            body="Tap to Pay needs a phone with NFC. You can still track your spending and plan in Hima."
          />
        </>
      );
      footer = (
        <View style={[styles.footer, styles.footerGap8]}>
          <HimaButton label="Back to Home" onPress={onClose} />
        </View>
      );
      break;
  }

  return (
    <Screen footer={footer} contentStyle={styles.screen}>
      {header}
      <View style={[styles.main, mainStyle]}>{body}</View>
    </Screen>
  );
}

function Headline({ title, body }: { title: string; body: string }) {
  return (
    <>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  main: {
    alignItems: 'center',
    paddingTop: 32,
  },
  main24: {
    paddingHorizontal: 24,
  },
  main20: {
    paddingHorizontal: 20,
  },
  pill28: {
    marginTop: 28,
  },
  pill24: {
    marginTop: 24,
  },
  title: {
    marginTop: 16,
    fontFamily: font.jakarta[700],
    fontSize: 22,
    lineHeight: lineHeight(22, 1.3),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontFamily: font.inter[400],
    fontSize: 15,
    lineHeight: lineHeight(15, 1.5),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  merchant: {
    marginTop: 14,
    fontFamily: font.jakarta[800],
    fontSize: 26,
    lineHeight: lineHeight(26, 1.2),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  merchantSub: {
    marginTop: 6,
    fontFamily: font.inter[400],
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  details: {
    marginTop: 20,
  },
  tagNote: {
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius[10],
    overflow: 'hidden',
    backgroundColor: colors.muted,
    fontFamily: font.inter[500],
    fontSize: 13,
    color: colors.textPrimary,
    ...tabular,
  },
  steps: {
    alignSelf: 'stretch',
    marginTop: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius[16],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  stepDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: font.jakarta[700],
    fontSize: 13,
    color: colors.blueText,
  },
  stepText: {
    flex: 1,
    fontFamily: font.inter[400],
    fontSize: 14,
    color: colors.textPrimary,
  },
  strong: {
    fontFamily: font.inter[600],
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 28,
  },
  footerGap12: {
    gap: 12,
  },
  footerGap8: {
    gap: 8,
  },
  footNote: {
    marginBottom: 6,
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  demo: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius[14],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoIcon: {
    marginTop: 1,
  },
  demoText: {
    flex: 1,
    fontFamily: font.inter[400],
    fontSize: 13,
    lineHeight: lineHeight(13, 1.5),
    color: colors.textPrimary,
  },
});
