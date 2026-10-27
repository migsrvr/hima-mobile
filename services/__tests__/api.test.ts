import { backend } from '../backend';
import { apiFetch as realApiFetch, ApiError, setApiSession } from '../api';

// Isolate HTTP behavior here; readiness is exercised separately.
const apiFetch: typeof realApiFetch = (path, init) => realApiFetch(path, { ...init, ensureReady: async () => {} });

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
  it('discards a lost response from the old account instead of reconciling under the new login', async () => {
    let fail!: (error: Error) => void;
    let sent!: () => void;
    const started = new Promise<void>((resolve) => { sent = resolve; });
    const fetchImpl = jest.fn(() => { sent(); return new Promise<Response>((_resolve, reject) => { fail = reject; }); });
    setApiSession('account-a.token', async () => 'account-a.fresh');
    const operation = apiFetch('/api/checkout/payments', { method: 'POST', fetchImpl: fetchImpl as typeof fetch });
    const rejected = expect(operation).rejects.toMatchObject({ code: 'SESSION_CHANGED' });
    await started;
    setApiSession('account-b.token', async () => 'account-b.fresh');
    fail(new Error('Lost response after submission'));
    await rejected;
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('never sends a queued payment as a different account after server wake', async () => {
    let ready!: () => void;
    const readiness = new Promise<void>((resolve) => { ready = resolve; });
    const fetchImpl = jest.fn();
    setApiSession('account-a.token', async () => 'account-a.fresh');
    const operation = realApiFetch('/api/checkout/payments', {
      method: 'POST', body: { paymentId: 'account-a-payment' }, fetchImpl,
      ensureReady: () => readiness,
    });
    const rejected = expect(operation).rejects.toMatchObject({ code: 'SESSION_CHANGED' });
    setApiSession('account-b.token', async () => 'account-b.fresh');
    ready();
    await rejected;
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('allows token renewal for the same login while readiness is pending', async () => {
    let ready!: () => void;
    const readiness = new Promise<void>((resolve) => { ready = resolve; });
    const { calls, fetchImpl } = server();
    setApiSession('old.token', async () => 'fresh.token');
    const operation = realApiFetch('/api/wallet/stellar', { fetchImpl, ensureReady: () => readiness });
    setApiSession('fresh.token');
    ready();
    await expect(operation).resolves.toEqual({ ok: true });
    expect(calls.map((call) => call.auth)).toEqual(['Bearer fresh.token']);
  });

  it('does not retry a rejected payment after logout during renewal', async () => {
    let renewed!: (token: string) => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => { entered = resolve; });
    setApiSession('old.token', () => { entered(); return new Promise<string>((resolve) => { renewed = resolve; }); });
    const { calls, fetchImpl } = server(['old.token']);
    const operation = apiFetch('/api/checkout/payments', { method: 'POST', fetchImpl });
    const rejected = expect(operation).rejects.toMatchObject({ code: 'SESSION_CHANGED' });
    await started;
    setApiSession(null, null);
    renewed('fresh.token');
    await rejected;
    expect(calls).toHaveLength(1);
  });

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


it('uses production readiness even when the operation fetch is injected', async () => {
  const ensure = jest.spyOn(backend, 'ensureReady').mockRejectedValueOnce(new Error('unavailable'));
  const fetchImpl = jest.fn();
  await expect(realApiFetch('/api/payments', { method: 'POST', fetchImpl })).rejects.toMatchObject({ code: 'BACKEND_UNAVAILABLE' });
  expect(ensure).toHaveBeenCalledTimes(1);
  expect(fetchImpl).not.toHaveBeenCalled();
  ensure.mockRestore();
});
