import { apiFetch, ApiError, setApiSession } from '../api';

type Call = { url: string; auth: string | null };

/** A fake server: answers 401 to any token in `rejected`, otherwise echoes `{ ok: true }`. */
function server(rejected: string[] = []) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const auth = (init?.headers as Record<string, string> | undefined)?.Authorization ?? null;
    calls.push({ url, auth });
    const denied = auth !== null && rejected.some((t) => auth === `Bearer ${t}`);
    return {
      ok: !denied,
      status: denied ? 401 : 200,
      json: async () => (denied ? { error: { code: 'UNAUTHENTICATED', message: 'Sign in again to continue.' } } : { ok: true }),
    } as Response;
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

afterEach(() => setApiSession(null, null));

describe('apiFetch sessions', () => {
  it('sends the signed-in session, but not on sign-in itself', async () => {
    setApiSession('payload.sig');
    const { calls, fetchImpl } = server();
    await apiFetch('/api/wallet/stellar', { fetchImpl });
    await apiFetch('/api/auth/session', { method: 'POST', body: { email: 'bea@example.com' }, auth: false, fetchImpl });
    expect(calls.map((c) => [c.url.replace(/^https?:\/\/[^/]+/, ''), c.auth])).toEqual([
      ['/api/wallet/stellar', 'Bearer payload.sig'],
      ['/api/auth/session', null],
    ]);
  });

  it('renews a rejected session once and retries with the new token', async () => {
    const renew = jest.fn(async () => 'fresh.token');
    setApiSession('old.token', renew);
    const { calls, fetchImpl } = server(['old.token']);
    await expect(apiFetch('/api/payments/pay-1', { fetchImpl })).resolves.toEqual({ ok: true });
    expect(renew).toHaveBeenCalledTimes(1);
    expect(calls.map((c) => c.auth)).toEqual(['Bearer old.token', 'Bearer fresh.token']);
  });

  it('gives up after one renewal, and when there is no way to renew', async () => {
    setApiSession('old.token', async () => 'also.rejected');
    const twice = server(['old.token', 'also.rejected']);
    await expect(apiFetch('/api/payments/pay-1', { fetchImpl: twice.fetchImpl })).rejects.toMatchObject({ status: 401 });
    expect(twice.calls).toHaveLength(2);

    setApiSession('old.token', async () => null);
    const none = server(['old.token']);
    const error = await apiFetch('/api/payments/pay-1', { fetchImpl: none.fetchImpl }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'http', status: 401, code: 'UNAUTHENTICATED' });
    expect(none.calls).toHaveLength(1);
  });
});
