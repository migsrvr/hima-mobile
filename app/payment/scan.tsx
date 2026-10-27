import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { NfcScanView, type NfcScreenState } from '@/components/payment/NfcScanView';
import { useBudget } from '@/hooks/useBudget';
import { categoryLeft } from '@/services/budget/week';
import { classifyTag, nfc } from '@/services/nfc';
import { openOrder, type Merchant } from '@/services/payments/merchants';
import { usePaymentStore } from '@/stores/payment';
import { formatPeso } from '@/utils/money';

/** Scanning stops after 30 seconds without a tag (11g). */
const SCAN_TIMEOUT_MS = 30_000;
/** Keep "Reading the tag" up long enough to be seen. */
const MIN_READING_MS = 700;

const PLAN_LABEL = { food: "Today's food plan", transport: "Today's transport plan", school: 'School plan', other: "Today's free-day plan" };

/** 11a–11g: waits for a tag, reads its ID only, and identifies the merchant. Never pays by itself. */
export default function ScanScreen() {
  const budget = useBudget();
  const startPayment = usePaymentStore((s) => s.start);
  const [state, setState] = useState<NfcScreenState>('ready');
  const [tagId, setTagId] = useState<string>();
  const [merchant, setMerchant] = useState<Merchant>();
  const [simulatedTap, setSimulatedTap] = useState(false);
  const run = useRef(0);

  const scan = useCallback(async () => {
    const id = ++run.current;
    const live = () => id === run.current;

    const availability = await nfc.availability();
    if (!live()) return;
    if (availability === 'disabled') return setState('disabled');
    if (availability === 'unsupportedDevice') return setState('noNfc');
    setSimulatedTap(nfc.simulated());

    setState('ready');
    const read = await nfc.readTag(SCAN_TIMEOUT_MS);
    if (!live()) return;
    if (read === 'timeout') return setState('timeout');
    if (read === 'cancelled') return;

    setState('scanning');
    await new Promise((resolve) => setTimeout(resolve, MIN_READING_MS));
    if (!live()) return;
    const meaning = classifyTag(read);
    setTagId(meaning.tagId);
    if (meaning.kind === 'merchant') {
      setMerchant(meaning.merchant);
      setState('recognized');
    } else {
      setState(meaning.kind);
    }
  }, []);

  useEffect(() => {
    // Start on the next tick so the first frame shows "Ready to scan".
    const start = setTimeout(scan, 0);
    return () => {
      clearTimeout(start);
      run.current += 1;
      nfc.cancel();
    };
  }, [scan]);

  // 11f: "Come back. Scanning restarts by itself."
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && state === 'disabled') scan();
    });
    return () => sub.remove();
  }, [state, scan]);

  const retry = () => {
    setTagId(undefined);
    setMerchant(undefined);
    scan();
  };

  const close = () => {
    run.current += 1;
    nfc.cancel();
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const planLeft =
    merchant && budget
      ? { label: PLAN_LABEL[merchant.category], value: `${formatPeso(categoryLeft(budget.summary, merchant.category))} left` }
      : undefined;

  return (
    <NfcScanView
      state={state}
      tagId={tagId}
      merchant={merchant}
      planLeft={planLeft}
      simulatedTap={simulatedTap}
      onClose={close}
      onRetry={retry}
      onOpenSettings={() => nfc.openSettings()}
      onContinue={() => {
        if (!merchant || !tagId) return;
        const order = openOrder(merchant.id);
        if (!order) return;
        startPayment(merchant, order, tagId);
        router.push('/payment/checkout');
      }}
    />
  );
}
