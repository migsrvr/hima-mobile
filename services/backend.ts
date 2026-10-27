import { Platform } from 'react-native';

import { createBackendReadiness } from './backendReadiness';

const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

/** Hima backend; local launch scripts can supply the PC's LAN address. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
export const backend = createBackendReadiness(API_URL);
