import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Persisted app state (plan inputs, preferences). Secrets go through services/secureStorage instead. */
export const appStorage = createJSONStorage(() => AsyncStorage);
