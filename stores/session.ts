import { create } from 'zustand';

import { setApiSession } from '@/services/api';
import { authService } from '@/services/auth';
import type { Session } from '@/types/user';

type SessionState = {
  /** `unknown` until the stored session has been checked (splash screen). */
  status: 'unknown' | 'signedOut' | 'signedIn';
  session: Session | null;
  restore: () => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
};

/** Server tokens are `<payload>.<signature>`; anything else (empty, or the old "demo-…") needs renewing. */
const looksSigned = (token: string) => token.split('.').length === 2;

export const useSessionStore = create<SessionState>()((set, get) => {
  let actionVersion = 0;
  let renewal: { session: Session; promise: Promise<string | null> } | null = null;

  /** Share startup renewal with a first request whose empty/expired token is rejected. */
  const renew = (): Promise<string | null> => {
    const current = get().session;
    if (!current) return Promise.resolve(null);
    if (renewal?.session === current) return renewal.promise;
    const promise = (async () => {
      const next = await authService.renew(current, () => get().session === current);
      if (!next || get().session !== current) return null;
      set({ session: next });
      setApiSession(next.token);
      return next.token;
    })().finally(() => {
      if (renewal?.promise === promise) renewal = null;
    });
    renewal = { session: current, promise };
    return promise;
  };

  const signedIn = (session: Session) => {
    set({ session, status: 'signedIn' });
    setApiSession(session.token, renew);
    if (!looksSigned(session.token)) void renew().catch(() => null);
  };

  const invalidate = () => {
    const version = ++actionVersion;
    setApiSession(null, null);
    set({ session: null, status: 'signedOut' });
    return version;
  };

  return {
    status: 'unknown',
    session: null,

    restore: async () => {
      const version = ++actionVersion;
      const session = await authService.restore().catch(() => null);
      if (version !== actionVersion) return;
      if (session) signedIn(session);
      else invalidate();
    },

    logIn: async (email, password) => {
      const version = invalidate();
      const session = await authService.logIn(email, password);
      if (version === actionVersion) signedIn(session);
    },

    signUp: async (email, password) => {
      const version = invalidate();
      const session = await authService.signUp(email, password);
      if (version === actionVersion) signedIn(session);
    },

    logOut: async () => {
      invalidate();
      await authService.logOut();
    },
  };
});
