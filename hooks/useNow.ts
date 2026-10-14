import { useEffect, useState } from 'react';

import { clock } from '@/services/clock';

/** The current time from services/clock, refreshed every `intervalMs` (default: each minute). */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    const id = setInterval(() => setNow(clock.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
