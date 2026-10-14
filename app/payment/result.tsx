import * as Clipboard from 'expo-clipboard';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Linking, StyleSheet } from 'react-native';

import { categoryVisuals } from '@/components/finance/categoryVisuals';
import { type DetailRow } from '@/components/payment/DetailRows';
import { ResultView } from '@/components/payment/ResultView';
import { IconButton } from '@/components/ui/IconButton';
import { Copy } from '@/components/ui/icons';
import { useBudget } from '@/hooks/useBudget';
import { categoryLeft } from '@/services/budget/week';
import { NETWORK_NAME } from '@/services/payments/network';
import { paymentProcessor, shortHash } from '@/services/payments/processor';
import { usePaymentStore } from '@/stores/payment';
import { colors, radius } from '@/theme';
import { exactAsset } from '@/utils/asset';
import { formatAgo, formatReceiptDate, formatTimeOfDay } from '@/utils/date';
import { formatPeso } from '@/utils/money';

const PLAN_NAME = { food: "Today's food plan", transport: "Today's transport plan", school: 'Your school plan', other: "Today's free-day plan" };

/** 14a–14c Result. Reached only after the network confirmed, failed, or is still pending. */
export default function ResultScreen() {
  const budget = useBudget();
  const session = usePaymentStore((s) => s.session);
  const checkStatus = usePaymentStore((s) => s.checkStatus);
  const start = usePaymentStore((s) => s.start);
  const clear = usePaymentStore((s) => s.clear);
  const [checking, setChecking] = useState(false);

  if (!session) return <Redirect href="/home" />;
  const outcome = session.phase;
  if (outcome !== 'confirmed' && outcome !== 'pending' && outcome !== 'failed') return null;
  if (!budget) return null;

  const { merchant, order } = session;
  const hash = session.txHash;
  const now = budget.now;

  const copyHash = async () => {
    if (!hash) return;
    await Clipboard.setStringAsync(hash);
    AccessibilityInfo.announceForAccessibility('Transaction hash copied');
  };

  // The exact amount that settled on-chain, from the server ("11.3333333 XLM").
  const settled = session.assetAmount && session.assetCode ? exactAsset(session.assetAmount, session.assetCode) : null;
  // Flow 1's split as verified on-chain: what the merchant got and the 10% that went to savings.
  const code = session.assetCode ?? 'XLM';
  const received = session.merchantReceived ? exactAsset(session.merchantReceived.assetAmount, code) : null;
  const saved = session.autoSaved ?? session.quote?.autoSaved ?? null;
  const savedOnChain = saved?.verified ? exactAsset(saved.assetAmount, code) : null;
  const splitRows: DetailRow[] = [
    ...(received ? [{ label: 'Canteen received', value: received, numeric: true }] : []),
    ...(saved ? [{ label: 'Auto-saved', value: savedOnChain ? `${formatPeso(saved.amount)} · ${savedOnChain}` : formatPeso(saved.amount), numeric: true }] : []),
    ...(session.verification === 'mismatch' ? [{ label: 'Split check', value: "Didn't match the flow" }] : []),
  ];

  let rows: DetailRow[];
  let note: string | undefined;
  if (outcome === 'confirmed') {
    rows = [
      { label: 'Merchant', value: `${merchant.name} · ${categoryVisuals[merchant.category].label}` },
      { label: 'Date', value: formatReceiptDate(new Date(session.settledAt ?? now.toISOString())) },
      { label: 'Reference', value: session.reference, numeric: true },
      {
        label: 'Transaction',
        value: hash ? shortHash(hash) : '',
        numeric: true,
        accessory: (
          <IconButton
            icon={Copy}
            accessibilityLabel="Copy transaction hash"
            onPress={copyHash}
            color={colors.deepSkyBlue}
            iconSize={16}
            style={styles.copy}
          />
        ),
      },
      ...(settled ? [{ label: 'Settled', value: settled, numeric: true }] : []),
      ...splitRows,
      { label: 'Network', value: NETWORK_NAME },
    ];
    const sts = formatPeso(budget.summary.safeToSpend);
    const impact = session.impact;
    note =
      impact && impact.fromSafeToSpend === 0 && impact.fromReserve === 0
        ? `Safe-to-Spend is still ${sts}. ${PLAN_NAME[merchant.category]} covered this, with ${formatPeso(
            categoryLeft(budget.summary, merchant.category),
            { compact: true },
          )} left.`
        : `Safe-to-Spend is now ${sts}.`;
  } else if (outcome === 'pending') {
    const submitted = session.submittedAt ? new Date(session.submittedAt) : now;
    rows = [
      { label: 'Status', value: 'Waiting for confirmation' },
      { label: 'Submitted', value: `${formatTimeOfDay(submitted)} · ${formatAgo(submitted, now)}` },
      { label: 'Reference', value: session.reference, numeric: true },
      { label: 'Transaction', value: hash ? shortHash(hash) : 'Not yet assigned', numeric: true },
    ];
    note = `Your Safe-to-Spend already counts this ${formatPeso(order.amount)}, so your numbers stay accurate while you wait.`;
  } else {
    rows = [
      { label: 'Reason', value: session.failureReason ?? 'The network rejected the payment' },
      { label: 'Reference', value: session.reference, numeric: true },
      { label: 'Wallet balance', value: `${formatPeso(budget.walletBalance)} · unchanged`, numeric: true },
    ];
  }

  const home = () => {
    clear();
    router.dismissAll();
    router.replace('/home');
  };

  return (
    <ResultView
      outcome={outcome}
      amount={order.amount}
      merchantName={merchant.name}
      rows={rows}
      note={note}
      checking={checking}
      onHome={home}
      onExplorer={() => hash && Linking.openURL(paymentProcessor.explorerUrl(hash))}
      onCheckStatus={async () => {
        setChecking(true);
        try {
          await checkStatus();
        } finally {
          setChecking(false);
        }
      }}
      onTryAgain={() => {
        start(merchant, order, session.tagId);
        router.replace('/payment/checkout');
      }}
    />
  );
}

const styles = StyleSheet.create({
  // 36 × 36 copy button inside the receipt row (14a), pulled 8 toward the edge.
  copy: {
    width: 36,
    height: 36,
    borderRadius: radius[10],
    marginRight: -8,
  },
});
