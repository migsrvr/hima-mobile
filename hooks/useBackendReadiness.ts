import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { backend } from '@/services/backend';

/** Wake on launch and when returning from the background; never replay an app operation. */
export function useBackendReadiness() {
  const status = useSyncExternalStore(backend.subscribe, backend.getStatus, backend.getStatus);
  useEffect(() => {
    const wake = () => { void backend.ensureReady().catch(() => {}); };
    wake();
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && previous !== 'active') wake();
      previous = next;
    });
    return () => subscription.remove();
  }, []);
  return { status, retry: () => { void backend.ensureReady().catch(() => {}); } };
}
