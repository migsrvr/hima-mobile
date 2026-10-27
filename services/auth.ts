import type { Session, User } from '@/types/user';

import { apiFetch } from './api';
import { secureStorage } from './secureStorage';

/**
 * Mock authentication for the demo build. Any well-formed email and password
 * signs in. The Hima server issues a signed session token for that email, which
 * every payment, wallet and AI request carries; if the server can't be reached at
 * sign-in, the app still opens and the token is fetched on the next request.
 */

const SESSION_KEY = 'hima.session';
const LATENCY_MS = 600;
let accountVersion = 0;
let persistence: Promise<void> = Promise.resolve();

/** A started write must finish before logout deletes it or another account replaces it. */
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = persistence.then(operation);
  persistence = result.then(() => {}, () => {});
  return result;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** "bea.reyes@example.com" -> Bea Reyes. Stand-in until the account has a real name. */
function nameFromEmail(email: string): Pick<User, 'firstName' | 'lastName'> {
  const local = email.split('@')[0] ?? '';
  const parts = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  return { firstName: parts[0] ?? 'Student', lastName: parts.slice(1).join(' ') };
}

/** A signed session from the Hima server, or '' when the server can't be reached right now. */
async function serverToken(email: string): Promise<string> {
  try {
    const { token } = await apiFetch<{ token: string }>('/api/auth/session', { method: 'POST', body: { email }, auth: false, timeoutMs: 10_000 });
    return token;
  } catch {
    return '';
  }
}

async function createSession(email: string): Promise<Session> {
  const version = ++accountVersion;
  const normalized = email.trim().toLowerCase();
  // Local demo access stays available while the session store renews the server token in the background.
  await wait(LATENCY_MS);
  const session: Session = {
    token: '',
    user: { id: normalized, email: normalized, ...nameFromEmail(normalized) },
  };
  return serialize(async () => {
    if (version !== accountVersion) throw new Error('The active account changed.');
    await secureStorage.set(SESSION_KEY, JSON.stringify(session));
    if (version !== accountVersion) throw new Error('The active account changed.');
    return session;
  });
}

export const authService = {
  logIn: (email: string, _password: string) => createSession(email),
  signUp: (email: string, _password: string) => createSession(email),

  async restore(): Promise<Session | null> {
    const version = accountVersion;
    return serialize(async () => {
      const raw = await secureStorage.get(SESSION_KEY);
      if (!raw || version !== accountVersion) return null;
      try {
        return JSON.parse(raw) as Session;
      } catch {
        await secureStorage.remove(SESSION_KEY);
        return null;
      }
    });
  },

  /** A fresh server token. Discard delayed replies after the active account changes. */
  async renew(session: Session, isCurrent: () => boolean = () => true): Promise<Session | null> {
    const version = accountVersion;
    const token = await serverToken(session.user.email);
    if (!token) return null;
    return serialize(async () => {
      if (version !== accountVersion || !isCurrent()) return null;
      const next = { ...session, token };
      await secureStorage.set(SESSION_KEY, JSON.stringify(next));
      return version === accountVersion && isCurrent() ? next : null;
    });
  },

  async logOut(): Promise<void> {
    accountVersion++;
    await serialize(() => secureStorage.remove(SESSION_KEY));
  },
};
