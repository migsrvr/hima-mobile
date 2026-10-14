import { Redirect, useLocalSearchParams } from 'expo-router';

import { AuthorizeSheet } from '@/components/payment/AuthorizeSheet';
import { CheckoutView } from '@/components/payment/CheckoutView';
import { NfcScanView, type NfcScreenState } from '@/components/payment/NfcScanView';
import { ProcessingView } from '@/components/payment/ProcessingView';
import { ResultView } from '@/components/payment/ResultView';
import { useBudget } from '@/hooks/useBudget';
import { checkoutNote } from '@/services/ai';
import { categoryLeft } from '@/services/budget/week';
import { evaluateCheckout } from '@/services/payments/checkout';
import { MERCHANTS, type MerchantOrder } from '@/services/payments/merchants';
import { NETWORK_NAME } from '@/services/payments/network';
import { formatPeso } from '@/utils/money';

/**
 * Dev-only previews of every payment state (11a–14c), for comparing with the design
 * files. Uses the real views and calculations with the demo merchants.
 */
const NFC: Record<string, NfcScreenState> = {
  '11a-NFC-Ready': 'ready',
  '11b-NFC-Scanning': 'scanning',
  '11c-NFC-Recognized': 'recognized',
  '11d-NFC-Unknown': 'unknown',
  '11e-NFC-Unsupported': 'unsupported',
  '11f-NFC-Disabled': 'disabled',
  '11g-NFC-Timeout': 'timeout',
};

const ORDERS: Record<string, { merchant: keyof typeof MERCHANTS; order: MerchantOrder }> = {
  '12a-Checkout': { merchant: 'campus-canteen', order: { amount: 85, description: 'Chicken rice meal' } },
  '12b-Checkout-Over': { merchant: 'campus-bookstore', order: { amount: 1150, description: 'Biology textbook' } },
  '12c-Checkout-Blocked': { merchant: 'campus-bookstore', order: { amount: 3200, description: 'Scientific calculator and lab manual' } },
};

const noop = () => {};
const REFERENCE = 'HM-1014-0042';
const HASH_SHORT = '0x7a3f…c91e';

export default function PaymentPreview() {
  const { screen = '11a-NFC-Ready' } = useLocalSearchParams<{ screen?: string }>();
  const budget = useBudget();
  if (!__DEV__) return <Redirect href="/" />;
  if (!budget) return null;

  const canteen = MERCHANTS['campus-canteen'];

  if (NFC[screen]) {
    return (
      <NfcScanView
        state={NFC[screen]}
        tagId={screen === '11d-NFC-Unknown' ? '049A3B7C91C0' : '04A1B2C34F2A'}
        merchant={canteen}
        planLeft={{ label: "Today's food plan", value: `${formatPeso(categoryLeft(budget.summary, 'food'))} left` }}
        onClose={noop}
        onContinue={noop}
        onRetry={noop}
        onOpenSettings={noop}
      />
    );
  }

  const checkoutKey = screen === '13a-Processing-Auth' ? '12a-Checkout' : screen;
  if (ORDERS[checkoutKey]) {
    const { merchant: id, order } = ORDERS[checkoutKey];
    const merchant = MERCHANTS[id];
    const evaluation = evaluateCheckout({ ...budget, amount: order.amount, category: merchant.category });
    return (
      <>
        <CheckoutView
          merchant={merchant}
          order={order}
          evaluation={evaluation}
          aiNote={checkoutNote(evaluation, budget)}
          onBack={noop}
          onPay={noop}
          onPayAnyway={noop}
          onCancel={noop}
          onRescan={noop}
        />
        <AuthorizeSheet
          visible={screen === '13a-Processing-Auth'}
          amount={order.amount}
          merchant={merchant}
          reference={REFERENCE}
          onFingerprint={noop}
          onPin={noop}
          onCancel={noop}
        />
      </>
    );
  }

  if (screen === '13b-Processing-Submit' || screen === '13c-Processing-Confirm') {
    return (
      <ProcessingView
        phase={screen === '13b-Processing-Submit' ? 'submitting' : 'confirming'}
        amount={85}
        merchantName={canteen.name}
        authorizedDetail="Fingerprint · 12:05 PM"
        submittedDetail={`Tx ${HASH_SHORT} · 12:05 PM`}
        reference={REFERENCE}
        onCopyReference={noop}
        onContinueInBackground={noop}
      />
    );
  }

  const evaluation = evaluateCheckout({ ...budget, amount: 85, category: 'food' });
  if (screen === '14a-Result-Success') {
    return (
      <ResultView
        outcome="confirmed"
        amount={85}
        merchantName={canteen.name}
        rows={[
          { label: 'Merchant', value: 'Campus Canteen · Food' },
          { label: 'Date', value: 'Wed, 14 Oct 2026 · 12:06 PM' },
          { label: 'Reference', value: REFERENCE, numeric: true },
          { label: 'Transaction', value: HASH_SHORT, numeric: true },
          { label: 'Settled', value: '11.3333333 XLM', numeric: true },
          { label: 'Network', value: NETWORK_NAME },
        ]}
        note={`Safe-to-Spend is still ${formatPeso(evaluation.after?.safeToSpend ?? 0)}. Today's food plan covered this, with ${formatPeso(
          evaluation.planLeftAfter,
          { compact: true },
        )} left.`}
        onHome={noop}
        onExplorer={noop}
        onCheckStatus={noop}
        onTryAgain={noop}
      />
    );
  }
  if (screen === '14b-Result-Pending') {
    return (
      <ResultView
        outcome="pending"
        amount={85}
        merchantName={canteen.name}
        rows={[
          { label: 'Status', value: 'Waiting for confirmation' },
          { label: 'Submitted', value: '12:05 PM · 2 min ago' },
          { label: 'Reference', value: REFERENCE, numeric: true },
          { label: 'Transaction', value: HASH_SHORT, numeric: true },
        ]}
        note="Your Safe-to-Spend already counts this ₱85.00, so your numbers stay accurate while you wait."
        onHome={noop}
        onExplorer={noop}
        onCheckStatus={noop}
        onTryAgain={noop}
      />
    );
  }
  return (
    <ResultView
      outcome="failed"
      amount={85}
      merchantName={canteen.name}
      rows={[
        { label: 'Reason', value: 'Network timeout' },
        { label: 'Reference', value: REFERENCE, numeric: true },
        { label: 'Wallet balance', value: `${formatPeso(budget.walletBalance)} · unchanged`, numeric: true },
      ]}
      onHome={noop}
      onExplorer={noop}
      onCheckStatus={noop}
      onTryAgain={noop}
    />
  );
}
