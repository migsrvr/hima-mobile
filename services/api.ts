import { API_URL, backend } from './backend';

export { API_URL } from './backend';

/**
 * `unreachable`: no answer at all (offline, server down, timeout), so the outcome is unknown.
 * `http`: the server answered with an error; `code` and `message` come from its `{ error }` body.
 * `SESSION_CHANGED` is a local 401 guard against sending or delivering an operation for another login.
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
  /** Explicit readiness dependency for isolated tests. Fetch injection alone never bypasses readiness. */
  ensureReady?: () => Promise<void>;
  /** Bind a multi-request operation to its initiating login. */
  sessionGeneration?: number;
};

/** The server-issued session token, and how to get a new one when it is rejected. Set by the session store. */
let sessionToken: string | null = null;
let renewSession: (() => Promise<string | null>) | null = null;
let sessionGeneration = 0;

/** An explicit renewal callback (or null) starts a new login/logout epoch; token-only updates renew the current account. */
export function setApiSession(token: string | null, renew?: (() => Promise<string | null>) | null) {
  if (renew !== undefined || !token) sessionGeneration += 1;
  sessionToken = token || null;
  if (renew !== undefined) renewSession = renew;
}

export const getApiSessionGeneration = () => sessionGeneration;

/**
 * JSON request to the Hima backend. Never returns made-up data: failures throw ApiError.
 * A rejected session (401) is renewed once and the request retried.
 */
export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const generation = init.sessionGeneration ?? sessionGeneration;
  const checkSession = () => {
    if (init.auth !== false && generation !== sessionGeneration) {
      throw new ApiError('http', 401, 'SESSION_CHANGED', 'Your account changed. Try again from your current account.');
    }
  };
  checkSession();
  try {
    await (init.ensureReady ?? backend.ensureReady)();
  } catch {
    checkSession();
    throw new ApiError('unreachable', undefined, 'BACKEND_UNAVAILABLE', "Hima's server is unavailable. Try again when connected.");
  }
  checkSession();
  try {
    const result = await send<T>(path, init, sessionToken);
    checkSession();
    return result;
  } catch (error) {
    checkSession();
    if (!(error instanceof ApiError && error.status === 401) || init.auth === false || !renewSession) throw error;
    checkSession();
    const token = await renewSession().catch(() => null);
    checkSession();
    if (!token) throw error;
    try {
      return await send<T>(path, init, token);
    } finally {
      checkSession();
    }
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
