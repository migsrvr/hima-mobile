import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { usePaymentStore } from '@/stores/payment';
import { useWalletStore } from '@/stores/wallet';

const MIN_GAP_MS = 15_000;
let lastSync = 0;

/**
 * When a screen comes into focus: refresh the testnet wallet and demo rate from the
 * server, and settle any payment left pending (for example after a restart).
 * At most once every 15 seconds across screens.
 */
export function useChainSync() {
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastSync < MIN_GAP_MS) return;
      lastSync = Date.now();
      const wallet = useWalletStore.getState();
      void wallet.refreshChain();
      void wallet.reconcilePending(usePaymentStore.getState().session?.id);
    }, []),
  );
}
