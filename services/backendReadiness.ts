export type BackendStatus = 'idle' | 'connecting' | 'ready' | 'unavailable';

export class BackendUnavailableError extends Error {
  constructor() {
    super("Hima's server is unavailable. You can keep using your local budget and try again.");
    this.name = 'BackendUnavailableError';
  }
}

/** Only GET /ready is retried. A single wake attempt is shared by all callers. */
export function createBackendReadiness(baseUrl: string, fetchImpl: typeof fetch = (...args) => fetch(...args)) {
  let status: BackendStatus = 'idle';
  let pending: Promise<void> | undefined;
  const listeners = new Set<() => void>();
  const update = (next: BackendStatus) => {
    if (status === next) return;
    status = next;
    listeners.forEach((listener) => listener());
  };

  async function probe(timeoutMs: number): Promise<boolean> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Bound fetch and JSON parsing even if the transport ignores abort.
      return await Promise.race([
        (async () => {
          const response = await fetchImpl(`${baseUrl}/ready`, {
            method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal,
          });
          if (response.status !== 200) return false;
          const body: unknown = await response.json();
          return (body as { status?: unknown } | null)?.status === 'ready';
        })(),
        new Promise<boolean>((resolve) => {
          timer = setTimeout(() => { controller.abort(); resolve(false); }, timeoutMs);
        }),
      ]);
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }

  async function wake() {
    const deadline = Date.now() + 120_000;
    // Healthy checks do not shift the app layout on every API operation.
    if (status !== 'ready') update('connecting');
    while (Date.now() < deadline) {
      if (await probe(Math.min(10_000, deadline - Date.now()))) {
        if (Date.now() < deadline) { update('ready'); return; }
      }
      update('connecting');
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(2_000, remaining)));
    }
    update('unavailable');
    throw new BackendUnavailableError();
  }

  return {
    getStatus: () => status,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    ensureReady(): Promise<void> {
      if (!pending) pending = wake().finally(() => { pending = undefined; });
      return pending;
    },
  };
}
