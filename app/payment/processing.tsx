import * as Clipboard from 'expo-clipboard';
import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

import { ProcessingView } from '@/components/payment/ProcessingView';
import { shortHash } from '@/services/payments/processor';
import { usePaymentStore } from '@/stores/payment';
import { formatTimeOfDay } from '@/utils/date';

/** 13b / 13c: follows the payment until the network answers, then shows the result. */
export default function ProcessingScreen() {
  const session = usePaymentStore((s) => s.session);
  const phase = session?.phase;

  useEffect(() => {
    if (phase === 'confirmed' || phase === 'pending' || phase === 'failed') router.replace('/payment/result');
  }, [phase]);

  if (!session) return <Redirect href="/home" />;
  if (phase !== 'submitting' && phase !== 'confirming') return null;

  const at = (iso?: string) => (iso ? formatTimeOfDay(new Date(iso)) : '');
  return (
    <ProcessingView
      phase={phase}
      amount={session.order.amount}
      merchantName={session.merchant.name}
      authorizedDetail={`${session.authMethod ?? 'Fingerprint'} · ${at(session.authorizedAt)}`}
      submittedDetail={session.txHash ? `Tx ${shortHash(session.txHash)} · ${at(session.submittedAt)}` : undefined}
      reference={session.reference}
      onCopyReference={async () => {
        await Clipboard.setStringAsync(session.reference);
        AccessibilityInfo.announceForAccessibility('Reference copied');
      }}
      onContinueInBackground={() => {
        // The payment keeps going in the store; Home shows it as pending until it settles.
        router.dismissAll();
        router.replace('/home');
      }}
    />
  );
}
