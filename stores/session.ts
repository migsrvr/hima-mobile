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
  /** Called by apiFetch when the server rejects the token: fetch a new one for the same account. */
  const renew = async (): Promise<string | null> => {
    const current = get().session;
    if (!current) return null;
    const next = await authService.renew(current);
    if (!next) return null;
    set({ session: next });
    setApiSession(next.token);
    return next.token;
  };

  const signedIn = (session: Session) => {
    set({ session, status: 'signedIn' });
    setApiSession(session.token, renew);
    if (!looksSigned(session.token)) void renew();
  };

  return {
    status: 'unknown',
    session: null,

    restore: async () => {
      const session = await authService.restore().catch(() => null);
      if (session) signedIn(session);
      else set({ session: null, status: 'signedOut' });
    },

    logIn: async (email, password) => {
      signedIn(await authService.logIn(email, password));
    },

    signUp: async (email, password) => {
      signedIn(await authService.signUp(email, password));
    },

    logOut: async () => {
      await authService.logOut();
      setApiSession(null, null);
      set({ session: null, status: 'signedOut' });
    },
  };
});
