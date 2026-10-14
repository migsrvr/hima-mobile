import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

/** Hima backend. scripts/start-windows.cjs points EXPO_PUBLIC_API_URL at the PC's LAN address for a phone. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

/**
 * `unreachable`: no answer at all (offline, server down, timeout), so the outcome is unknown.
 * `http`: the server answered with an error; `code` and `message` come from its `{ error }` body.
 */
export class ApiError extends Error {
  constructor(
    readonly kind: 'unreachable' | 'http',
    readonly status: number | undefined,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiInit = {
  method?: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
  /** Send the signed-in session (default). Sign-in itself sends none. */
  auth?: boolean;
  /** Tests pass a fake. */
  fetchImpl?: typeof fetch;
};

/** The server-issued session token, and how to get a new one when it is rejected. Set by the session store. */
let sessionToken: string | null = null;
let renewSession: (() => Promise<string | null>) | null = null;

export function setApiSession(token: string | null, renew?: (() => Promise<string | null>) | null) {
  sessionToken = token || null;
  if (renew !== undefined) renewSession = renew;
}

/**
 * JSON request to the Hima backend. Never returns made-up data: failures throw ApiError.
 * A rejected session (401) is renewed once and the request retried.
 */
export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  try {
    return await send<T>(path, init, sessionToken);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401) || init.auth === false || !renewSession) throw error;
    const token = await renewSession().catch(() => null);
    if (!token) throw error;
    return send<T>(path, init, token);
  }
}

async function send<T>(path: string, { method = 'GET', body, timeoutMs = 15_000, auth = true, fetchImpl = fetch }: ApiInit, token: string | null): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchImpl(`${API_URL}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw new ApiError('unreachable', undefined, controller.signal.aborted ? 'TIMEOUT' : 'UNREACHABLE', "Couldn't reach Hima's server");
    }
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = undefined;
    }
    if (!res.ok) {
      const error = (data as { error?: { code?: unknown; message?: unknown } } | undefined)?.error;
      throw new ApiError(
        'http',
        res.status,
        typeof error?.code === 'string' ? error.code : `HTTP_${res.status}`,
        typeof error?.message === 'string' ? error.message : `Hima's server answered ${res.status}`,
      );
    }
    if (data === undefined) throw new ApiError('http', res.status, 'BAD_RESPONSE', "Hima's server sent an unreadable reply");
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}
