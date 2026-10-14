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
  const normalized = email.trim().toLowerCase();
  const [token] = await Promise.all([serverToken(normalized), wait(LATENCY_MS)]);
  const session: Session = {
    token,
    user: { id: normalized, email: normalized, ...nameFromEmail(normalized) },
  };
  await secureStorage.set(SESSION_KEY, JSON.stringify(session));
  return session;
}

export const authService = {
  logIn: (email: string, _password: string) => createSession(email),
  signUp: (email: string, _password: string) => createSession(email),

  async restore(): Promise<Session | null> {
    const raw = await secureStorage.get(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      await secureStorage.remove(SESSION_KEY);
      return null;
    }
  },

  /** A fresh server token for an existing session (expired, rejected, or never issued). */
  async renew(session: Session): Promise<Session | null> {
    const token = await serverToken(session.user.email);
    if (!token) return null;
    const next = { ...session, token };
    await secureStorage.set(SESSION_KEY, JSON.stringify(next));
    return next;
  },

  async logOut(): Promise<void> {
    await secureStorage.remove(SESSION_KEY);
  },
};
