import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { AuthorizeSheet } from '@/components/payment/AuthorizeSheet';
import { CheckoutView } from '@/components/payment/CheckoutView';
import { TriangleAlert } from '@/components/ui/icons';
import { HimaModal } from '@/components/ui/HimaModal';
import { useBudget } from '@/hooks/useBudget';
import { checkoutNote } from '@/services/ai';
import { authorizePayment, type AuthMethod } from '@/services/biometric';
import { evaluateCheckout } from '@/services/payments/checkout';
import { usePaymentStore } from '@/stores/payment';
import { useSettingsStore } from '@/stores/settings';
import { approxAsset } from '@/utils/asset';
import { formatPeso } from '@/utils/money';

/** "₱76.50 to Campus Canteen · ₱8.50 to your savings", from the server's quote. */
function splitNote(split: { role: string; label: string; amount: number }[] | undefined): string | null {
  if (!split?.length) return null;
  return split.map((l) => `${formatPeso(l.amount)} to ${l.role === 'savings' ? 'your savings' : l.label}`).join(' · ');
}

/** 12a–12c Checkout, with the reserve dialog (12b) and the authorization sheet (13a). */
export default function CheckoutScreen() {
  const budget = useBudget();
  const session = usePaymentStore((s) => s.session);
  const pay = usePaymentStore((s) => s.pay);
  const clear = usePaymentStore((s) => s.clear);
  const loadQuote = usePaymentStore((s) => s.loadQuote);
  const aiOn = useSettingsStore((s) => s.aiSuggestions);
  const [confirmReserve, setConfirmReserve] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [usedOverride, setUsedOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const sessionId = session?.id;

  // The server's price and 90/10 split for this checkout (shown when it arrives; paying doesn't wait for it).
  useEffect(() => {
    if (sessionId) void loadQuote();
  }, [sessionId, loadQuote]);

  if (!session) return <Redirect href="/home" />;
  if (!budget) return null;

  const evaluation = evaluateCheckout({
    plan: budget.plan,
    transactions: budget.transactions,
    walletBalance: budget.walletBalance,
    now: budget.now,
    amount: session.order.amount,
    category: session.merchant.category,
  });

  const cancel = () => {
    clear();
    router.dismissAll();
    router.replace('/home');
  };

  const authorize = async (method: AuthMethod): Promise<boolean> => {
    setBusy(true);
    try {
      const ok = await authorizePayment(method, `Authorize ${formatPeso(session.order.amount)} to ${session.merchant.name}`);
      if (!ok) {
        if (method === 'Fingerprint') {
          // Allow AuthorizeSheet to fall back to in-app PIN
          return false;
        }
        AccessibilityInfo.announceForAccessibility('Not authorized. Nothing was charged.');
        return false;
      }
      setAuthorizing(false);
      // Payment runs in the store; the processing screen follows its progress.
      pay(method, usedOverride, {
        fromPlan: evaluation.fromPlan,
        fromSafeToSpend: evaluation.fromSafeToSpend,
        fromReserve: evaluation.fromReserve + evaluation.fromSavings,
      });
      router.replace('/payment/processing');
      return true;
    } finally {
      setBusy(false);
    }
  };

  const fromReserves = evaluation.fromReserve + evaluation.fromSavings;

  return (
    <>
      <CheckoutView
        merchant={session.merchant}
        order={session.order}
        evaluation={evaluation}
        assetPreview={approxAsset(session.order.amount, budget.chain)}
        splitNote={splitNote(session.quote?.split)}
        aiNote={aiOn ? checkoutNote(evaluation, budget) : undefined}
        onBack={() => (router.canGoBack() ? router.back() : cancel())}
        onPay={() => {
          setUsedOverride(false);
          setAuthorizing(true);
        }}
        onPayAnyway={() => setConfirmReserve(true)}
        onCancel={cancel}
        onRescan={() => {
          clear();
          router.replace('/payment/scan');
        }}
      />

      <HimaModal
        visible={confirmReserve}
        onRequestClose={() => setConfirmReserve(false)}
        icon={TriangleAlert}
        title="Use your emergency reserve?"
        message={`This payment goes ${formatPeso(fromReserves)} past your Safe-to-Spend. Your reserve drops from ${formatPeso(
          evaluation.reserveBefore,
        )} to ${formatPeso(evaluation.reserveAfter)}.`}
        actions={[
          {
            label: 'Pay anyway',
            variant: 'override',
            onPress: () => {
              setConfirmReserve(false);
              setUsedOverride(true);
              setAuthorizing(true);
            },
          },
          { label: 'Keep reserve', variant: 'primary', onPress: () => setConfirmReserve(false) },
        ]}
      />

      <AuthorizeSheet
        visible={authorizing}
        amount={session.order.amount}
        merchant={session.merchant}
        reference={session.reference}
        busy={busy}
        onFingerprint={() => authorize('Fingerprint')}
        onPin={() => authorize('PIN')}
        onCancel={() => setAuthorizing(false)}
      />
    </>
  );
}
