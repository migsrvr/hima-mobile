import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { SplashView } from '@/components/ui/SplashView';
import { usePersistHydrated } from '@/hooks/usePersistHydrated';
import { usePlanStore } from '@/stores/plan';
import { useSessionStore } from '@/stores/session';

/** Long enough for the brand to register, short enough not to slow anyone down. */
const MIN_VISIBLE_MS = 900;

/**
 * 01 Splash. Waits for the stored session and saved plan, then redirects:
 * signed out -> Log in; signed in without a confirmed plan -> setup; otherwise Home.
 */
export default function Splash() {
  const status = useSessionStore((s) => s.status);
  const userId = useSessionStore((s) => s.session?.user.id);
  const planReady = usePersistHydrated(usePlanStore);
  const hasPlan = usePlanStore((s) => (userId ? s.plans[userId] != null : false));
  const [minShown, setMinShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinShown(true), MIN_VISIBLE_MS);
    return () => clearTimeout(t);
  }, []);

  if (status !== 'unknown' && planReady && minShown) {
    return <Redirect href={status === 'signedOut' ? '/login' : hasPlan ? '/home' : '/allowance'} />;
  }
  return <SplashView />;
}
