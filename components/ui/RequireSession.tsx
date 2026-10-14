import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useSessionStore } from '@/stores/session';

/**
 * Renders its children only for a signed-in student. Signed-out visitors go to Log in.
 * While the stored session is still being checked, nothing renders (the splash covers it).
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);
  if (status === 'unknown') return null;
  if (status === 'signedOut') return <Redirect href="/login" />;
  return <>{children}</>;
}
