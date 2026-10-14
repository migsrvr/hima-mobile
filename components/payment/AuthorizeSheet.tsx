import { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { categoryVisuals } from '@/components/finance/categoryVisuals';
import { HimaBottomSheet } from '@/components/ui/HimaBottomSheet';
import { HimaButton } from '@/components/ui/HimaButton';
import { IconButton } from '@/components/ui/IconButton';
import { ArrowLeft, FingerprintPattern, Lock, X } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { DEMO_PIN, isDemoPin } from '@/services/biometric';
import type { Merchant } from '@/services/payments/merchants';
import { colors, font, radius, tabular } from '@/theme';
import { formatPeso } from '@/utils/money';

import { DetailRows } from './DetailRows';
import { StatusPill } from './StatusPill';

type Props = {
  visible: boolean;
  amount: number;
  merchant: Merchant;
  reference: string;
  /** While the system biometric prompt is open. */
  busy?: boolean;
  onFingerprint: () => Promise<boolean> | void;
  onPin: () => void;
  onCancel: () => void;
};

/** 13a Awaiting authorization: fingerprint or in-app 4-digit PIN. */
export function AuthorizeSheet({ visible, amount, merchant, reference, busy, onFingerprint, onPin, onCancel }: Props) {
  const [mode, setMode] = useState<'fingerprint' | 'pin'>('fingerprint');
  const [pin, setPin] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  // Each time the sheet opens it starts on fingerprint with no PIN (adjusted during render, not in an effect).
  const [openedWith, setOpenedWith] = useState(visible);
  if (visible !== openedWith) {
    setOpenedWith(visible);
    if (visible) {
      setMode('fingerprint');
      setPin('');
      setHint(null);
    }
  }

  const handleFingerprint = async () => {
    const res = await onFingerprint();
    if (res === false) {
      setMode('pin');
      setHint('Fingerprint unavailable or cancelled. Enter PIN (1234).');
    }
  };

  const handleKey = (key: string) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
    } else if (key === 'quick') {
      setPin(DEMO_PIN);
      setTimeout(onPin, 80);
    } else if (pin.length < 4) {
      const next = pin + key;
      setPin(next);
      if (next.length === 4) {
        if (isDemoPin(next)) {
          setTimeout(onPin, 80);
        } else {
          // A wrong PIN never authorizes: show the four dots briefly, then clear them.
          setHint('Wrong PIN. Try again.');
          AccessibilityInfo.announceForAccessibility('Wrong PIN. Try again.');
          setTimeout(() => setPin(''), 350);
        }
      }
    }
  };

  return (
    <HimaBottomSheet
      visible={visible}
      onRequestClose={busy ? undefined : onCancel}
      accessibilityLabel="Authorize payment"
      cornerRadius={radius[28]}
      gap={0}
      paddingBottom={24}>
      <View style={styles.topRow}>
        {mode === 'pin' ? (
          <IconButton
            icon={ArrowLeft}
            accessibilityLabel="Back to fingerprint"
            onPress={() => setMode('fingerprint')}
            disabled={busy}
            color={colors.textSecondary}
            iconSize={20}
            style={styles.back}
          />
        ) : (
          <StatusPill label="Awaiting authorization" tone="neutral" leading={Lock} size="sm" />
        )}
        <IconButton
          icon={X}
          accessibilityLabel="Cancel payment"
          onPress={onCancel}
          disabled={busy}
          color={colors.textSecondary}
          iconSize={20}
          style={styles.close}
        />
      </View>

      <View style={styles.print} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {mode === 'pin' ? (
          <Lock size={36} color={colors.deepSkyBlue} strokeWidth={2} />
        ) : (
          <FingerprintPattern size={40} color={colors.deepSkyBlue} strokeWidth={1.8} />
        )}
      </View>

      <Text style={styles.title} accessibilityRole="header">
        {mode === 'pin' ? 'Enter 4-digit PIN' : `Authorize ${formatPeso(amount)}`}
      </Text>
      <Text style={styles.sub}>
        {mode === 'pin'
          ? hint ?? `Authorize ${formatPeso(amount)} to ${merchant.name} (Demo PIN: 1234)`
          : `to ${merchant.name} · ${categoryVisuals[merchant.category].label}`}
      </Text>

      {mode === 'fingerprint' ? (
        <>
          <DetailRows
            variant="sheet"
            style={styles.details}
            rows={[
              { label: 'Paying from', value: 'Hima wallet · testnet' },
              { label: 'Reference', value: reference, numeric: true },
            ]}
          />
          <HimaButton
            label="Use fingerprint"
            variant="pay"
            size="xl"
            loading={busy}
            onPress={handleFingerprint}
            style={styles.primary}
            testID="auth-fingerprint"
          />
          <HimaButton
            label="Use PIN instead"
            variant="text"
            size="compact"
            disabled={busy}
            onPress={() => setMode('pin')}
            style={styles.secondary}
          />
        </>
      ) : (
        <View style={styles.pinSection}>
          <View style={styles.pinDots} accessible accessibilityLabel={`${pin.length} of 4 digits entered`}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
            ))}
          </View>

          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['quick', '0', 'del'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keyRow}>
                {row.map((k) => (
                  <Pressable
                    key={k}
                    style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
                    onPress={() => handleKey(k)}
                    accessibilityRole="button"
                    accessibilityLabel={k === 'del' ? 'Delete' : k === 'quick' ? `Enter demo PIN ${DEMO_PIN}` : k}>
                    <Text style={[styles.keyText, k === 'quick' && styles.quickKeyText]}>
                      {k === 'del' ? '⌫' : k === 'quick' ? '1234' : k}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          <HimaButton
            label="Quick approve (1234)"
            variant="pay"
            size="xl"
            onPress={() => {
              setPin(DEMO_PIN);
              setTimeout(onPin, 50);
            }}
            style={styles.quickApproveBtn}
          />
        </View>
      )}
    </HimaBottomSheet>
  );
}

const styles = StyleSheet.create({
  topRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  back: {
    marginLeft: -10,
  },
  close: {
    marginRight: -10,
  },
  print: {
    width: 80,
    height: 80,
    marginTop: 8,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    fontFamily: font.jakarta[800],
    fontSize: 24,
    color: colors.textPrimary,
    ...tabular,
  },
  sub: {
    marginTop: 4,
    fontFamily: font.inter[400],
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  details: {
    marginTop: 16,
  },
  primary: {
    marginTop: 18,
  },
  secondary: {
    marginTop: 6,
  },
  pinSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    borderColor: colors.deepSkyBlue,
    backgroundColor: colors.deepSkyBlue,
  },
  keypad: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  keyBtn: {
    width: 76,
    height: 48,
    borderRadius: radius[14],
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: colors.border,
  },
  keyText: {
    fontFamily: font.jakarta[700],
    fontSize: 20,
    color: colors.textPrimary,
  },
  quickKeyText: {
    fontSize: 14,
    color: colors.deepSkyBlue,
  },
  quickApproveBtn: {
    marginTop: 14,
  },
});
