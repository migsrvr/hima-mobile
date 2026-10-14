import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appStorage } from './storage';

export type SettingKey = 'aiSuggestions' | 'paymentUpdates' | 'dailySummary' | 'appLock';

/** A Freighter testnet address the student linked in Profile. Read-only: it never pays. */
export type FreighterLink = {
  address: string;
  /** Whether the account exists on testnet, and its XLM balance, at `checkedAt`. */
  exists: boolean;
  balance: string | null;
  checkedAt: string;
};

type SettingsState = Record<SettingKey, boolean> & {
  freighter: FreighterLink | null;
  toggle: (key: SettingKey) => void;
  setFreighter: (link: FreighterLink | null) => void;
};

/** 15 Profile switches. Defaults match the design. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiSuggestions: true,
      paymentUpdates: true,
      dailySummary: false,
      appLock: true,
      freighter: null,
      toggle: (key) => set((s) => ({ [key]: !s[key] }) as Partial<SettingsState>),
      setFreighter: (freighter) => set({ freighter }),
    }),
    { name: 'hima.settings', storage: appStorage, version: 1 },
  ),
);
