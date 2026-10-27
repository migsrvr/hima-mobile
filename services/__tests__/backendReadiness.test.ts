import { createBackendReadiness } from '../backendReadiness';
import { apiFetch } from '../api';

const reply = (ready: boolean) => ({ ok: ready, status: ready ? 200 : 503, json: async () => ({ status: ready ? 'ready' : 'unavailable' }) }) as Response;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('backend readiness', () => {
  it('shares concurrent wake calls and probes every two seconds until ready', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(reply(false)).mockResolvedValue(reply(true));
    const backend = createBackendReadiness('https://hima.test', fetchImpl);
    const first = backend.ensureReady();
    expect(backend.ensureReady()).toBe(first);
    expect(backend.getStatus()).toBe('connecting');
    await jest.advanceTimersByTimeAsync(1_999);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await first;
    expect(backend.getStatus()).toBe('ready');
    expect(fetchImpl.mock.calls.every(([url, init]) => url === 'https://hima.test/ready' && init.method === 'GET')).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('bounds hanging transports to ten seconds and the complete wake to 120 seconds', async () => {
    let late: (value: Response) => void = () => {};
    const fetchImpl = jest.fn().mockImplementation(() => new Promise<Response>((resolve) => { late = resolve; }));
    const backend = createBackendReadiness('https://hima.test', fetchImpl);
    const result = backend.ensureReady().catch((error) => error);
    const signal = fetchImpl.mock.calls[0][1].signal;
    await jest.advanceTimersByTimeAsync(10_000);
    expect(signal.aborted).toBe(true);
    await jest.advanceTimersByTimeAsync(110_000);
    expect((await result).name).toBe('BackendUnavailableError');
    expect(backend.getStatus()).toBe('unavailable');
    expect(fetchImpl).toHaveBeenCalledTimes(10);
    late(reply(true));
    await jest.advanceTimersByTimeAsync(0);
    expect(backend.getStatus()).toBe('unavailable');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('handles offline failure, permits explicit retry, and checks a previously healthy server again', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError('offline'));
    const backend = createBackendReadiness('https://hima.test', fetchImpl);
    const result = backend.ensureReady().catch((error) => error);
    await jest.advanceTimersByTimeAsync(120_000);
    await result;
    expect(backend.getStatus()).toBe('unavailable');
    fetchImpl.mockResolvedValue(reply(true));
    await backend.ensureReady();
    expect(backend.getStatus()).toBe('ready');
    const calls = fetchImpl.mock.calls.length;
    await backend.ensureReady();
    expect(fetchImpl).toHaveBeenCalledTimes(calls + 1);
  });

  it('waits before POST, sends it once, and never replays a failed operation', async () => {
    const probes = jest.fn().mockResolvedValueOnce(reply(false)).mockResolvedValue(reply(true));
    const backend = createBackendReadiness('https://hima.test', probes);
    const operation = jest.fn().mockRejectedValue(new TypeError('lost response'));
    const result = apiFetch('/api/payments', { method: 'POST', body: { amount: 20 }, fetchImpl: operation, ensureReady: backend.ensureReady }).catch((error) => error);
    expect(operation).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(2_000);
    expect(await result).toMatchObject({ kind: 'unreachable' });
    expect(operation).toHaveBeenCalledTimes(1);
    await backend.ensureReady();
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('does not send POST when readiness expires, including with injected operation fetch', async () => {
    const backend = createBackendReadiness('https://hima.test', jest.fn().mockResolvedValue(reply(false)));
    const operation = jest.fn();
    const result = apiFetch('/api/payments', { method: 'POST', fetchImpl: operation, ensureReady: backend.ensureReady }).catch((error) => error);
    await jest.advanceTimersByTimeAsync(120_000);
    expect(await result).toMatchObject({ code: 'BACKEND_UNAVAILABLE' });
    expect(operation).not.toHaveBeenCalled();
  });
});
