import { useSyncExternalStore } from 'react';

type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

/** True once a zustand `persist` store has loaded its saved state from storage. */
export function usePersistHydrated(store: PersistedStore): boolean {
  return useSyncExternalStore(
    (onChange) => store.persist.onFinishHydration(onChange),
    () => store.persist.hasHydrated(),
    () => false,
  );
}
