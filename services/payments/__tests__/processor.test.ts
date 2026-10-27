import { CONFIRMATION_TIMEOUT_MS, createPaiflowProcessor, shortHash } from '../processor';
import { setApiSession } from '../../api';

const HASH = '94be52e8a937b6ddcb85da7cd917f97d412753e5e3ca47ea48b252a264b2278d';
const REQUEST = { paymentId: 'pay-1760414700000', merchantId: 'campus-canteen', amount: 85, reference: 'HM-1014-0042' };

const view = (status: 'pending' | 'confirmed' | 'failed', extra: Record<string, unknown> = {}) => ({
  paymentId: REQUEST.paymentId, status, txHash: HASH, assetAmount: '11.3333333', assetCode: 'XLM', ...extra,
});

type Reply = { status: number; body: unknown } | 'unreachable';

/** A fake fetch that answers from a script, and the time a fake sleep has passed. */
function server(replies: Reply[]) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  let clock = 0;
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const reply = replies.shift() ?? 'unreachable';
    if (reply === 'unreachable') throw new TypeError('Network request failed');
    return { ok: reply.status < 400, status: reply.status, json: async () => reply.body } as Response;
  }) as unknown as typeof fetch;
  const sleeps: number[] = [];
  const processor = createPaiflowProcessor({
    fetchImpl,
    ensureReady: async () => {},
    sleep: async (ms) => {
      sleeps.push(ms);
      clock += ms;
    },
    now: () => clock,
  });
  return { processor, calls, sleeps };
}

describe('Paiflow payment processor', () => {
  it('stops polling the old payment when the account changes between status reads', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    setApiSession('account-a.token', async () => 'account-a.fresh');
    const processor = createPaiflowProcessor({
      fetchImpl, ensureReady: async () => {},
      sleep: async () => { setApiSession('account-b.token', async () => 'account-b.fresh'); },
    });
    await expect(processor.waitForConfirmation(REQUEST.paymentId, HASH)).resolves.toEqual({ status: 'pending' });
    expect(fetchImpl).not.toHaveBeenCalled();
    setApiSession(null, null);
  });

  it('does not submit or repeat a wake attempt when readiness fails; the prior outcome stays unknown', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    const ensureReady = jest.fn(async () => { throw new Error('Backend sleeping or unavailable'); });
    const sleep = jest.fn(async () => {});
    const processor = createPaiflowProcessor({ fetchImpl, ensureReady, sleep });
    await expect(processor.submit(REQUEST)).resolves.toEqual({ status: 'pending' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(ensureReady).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    await expect(processor.checkStatus(REQUEST.paymentId)).resolves.toEqual({ status: 'pending' });
    expect(ensureReady).toHaveBeenCalledTimes(2);
  });
  it('submits once to the Hima server and follows the payment until it is confirmed', async () => {
    const { processor, calls, sleeps } = server([
      { status: 200, body: view('pending') },
      { status: 200, body: view('pending') },
      { status: 200, body: view('confirmed', { ledger: 1842917 }) },
    ]);
    const submitted = await processor.submit(REQUEST);
    expect(submitted).toEqual({ status: 'pending', txHash: HASH, ledger: undefined, assetAmount: '11.3333333', assetCode: 'XLM', failureReason: undefined });
    expect(calls[0]).toEqual({ url: expect.stringMatching(/\/api\/checkout\/payments$/), method: 'POST', body: REQUEST });

    const settled = await processor.waitForConfirmation(REQUEST.paymentId, HASH);
    expect(settled.status).toBe('confirmed');
    expect(settled.ledger).toBe(1842917);
    expect(calls.slice(1).map((c) => c.url)).toEqual([
      expect.stringMatching(/\/api\/payments\/pay-1760414700000$/),
      expect.stringMatching(/\/api\/payments\/pay-1760414700000$/),
    ]);
    expect(sleeps).toEqual([2000, 2000]);
  });

  it('reports pending, never failed, when confirmation outlasts the timeout', async () => {
    const { processor, sleeps } = server(Array.from({ length: 40 }, () => ({ status: 200, body: view('pending') })));
    const outcome = await processor.waitForConfirmation(REQUEST.paymentId, HASH);
    expect(outcome.status).toBe('pending');
    expect(outcome.txHash).toBe(HASH);
    expect(sleeps.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(CONFIRMATION_TIMEOUT_MS);
  });

  it('keeps following through outages until the timeout', async () => {
    const { processor } = server(['unreachable', 'unreachable', { status: 200, body: view('confirmed', { ledger: 7 }) }]);
    expect((await processor.waitForConfirmation(REQUEST.paymentId, HASH)).status).toBe('confirmed');
  });

  it("uses the server's reason for a failed payment", async () => {
    const { processor } = server([{ status: 200, body: view('failed', { failure: { code: 'txTooLate', reason: 'Expired before it reached the network' } }) }]);
    expect(await processor.submit(REQUEST)).toMatchObject({ status: 'failed', failureReason: 'Expired before it reached the network' });
  });

  it('calls a refused payment failed only after the server confirms it has no record of it', async () => {
    const { processor, calls } = server([
      { status: 402, body: { error: { code: 'WALLET_NOT_FUNDED', message: "Hima's testnet wallet isn't funded" } } },
      { status: 404, body: { error: { code: 'PAYMENT_NOT_FOUND', message: 'No payment with this id reached the server.' } } },
    ]);
    expect(await processor.submit(REQUEST)).toEqual({ status: 'failed', failureReason: "Hima's testnet wallet isn't funded" });
    expect(calls.map((c) => c.method)).toEqual(['POST', 'GET']);
  });

  it("the public demo's daily limit (429) is a failed payment with the server's reason, and nothing is re-read", async () => {
    const { processor, calls } = server([
      { status: 429, body: { error: { code: 'RATE_LIMITED', message: 'The public demo allows a few testnet payments per day. Try again tomorrow.' } } },
    ]);
    expect(await processor.submit(REQUEST, { quoteId: REQUEST.paymentId })).toEqual({
      status: 'failed',
      failureReason: 'The public demo allows a few testnet payments per day. Try again tomorrow.',
    });
    expect(calls.map((c) => c.method)).toEqual(['POST']);
  });

  it('a submission that got no answer but reached the server takes the server\'s status', async () => {
    const { processor } = server(['unreachable', { status: 200, body: view('pending') }]);
    expect(await processor.submit(REQUEST)).toMatchObject({ status: 'pending', txHash: HASH });
  });

  it('with no answer at all the outcome is unknown, so pending', async () => {
    const { processor, calls } = server(['unreachable', 'unreachable', 'unreachable', 'unreachable']);
    expect(await processor.submit(REQUEST)).toEqual({ status: 'pending' });
    expect(calls).toHaveLength(4);
  });

  it('check status: unreachable stays pending; a payment the server never saw is failed', async () => {
    const offline = server(['unreachable']);
    expect(await offline.processor.checkStatus(REQUEST.paymentId, HASH)).toEqual({ status: 'pending', txHash: HASH });
    const neverSent = server([{ status: 404, body: { error: { code: 'PAYMENT_NOT_FOUND', message: 'x' } } }]);
    expect(await neverSent.processor.checkStatus(REQUEST.paymentId)).toEqual({
      status: 'failed',
      failureReason: "The payment never reached Hima's server",
    });
  });

  it('explorer links point at stellar.expert testnet', () => {
    const { processor } = server([]);
    expect(processor.explorerUrl(HASH)).toBe(`https://stellar.expert/explorer/testnet/tx/${HASH}`);
  });
});

describe('checkout quotes and the 90/10 split', () => {
  const split = [
    { role: 'merchant', label: 'Campus Canteen', percent: 90, amount: 76.5, assetAmount: '10.1999999' },
    { role: 'savings', label: 'Your savings', percent: 10, amount: 8.5, assetAmount: '1.1333334' },
  ];

  it('quotes, then pays exactly that quote', async () => {
    const { processor, calls } = server([
      { status: 200, body: view('pending', { quoteId: 'att_q1', txHash: undefined, split, autoSaved: { amount: 8.5, assetAmount: '1.1333334', verified: false } }) },
      { status: 200, body: view('pending', { quoteId: 'att_q1' }) },
    ]);
    const quote = await processor.quote(REQUEST);
    expect(quote).toEqual({ quoteId: 'att_q1', split, autoSaved: { amount: 8.5, assetAmount: '1.1333334', verified: false } });
    await processor.submit(REQUEST, { quoteId: quote.quoteId });
    expect(calls.map((c) => [c.url.replace(/^https?:\/\/[^/]+/, ''), c.body])).toEqual([
      ['/api/checkout/quote', REQUEST],
      ['/api/checkout/payments', { quoteId: 'att_q1' }],
    ]);
  });

  it('reports what the merchant received and the verified auto-save once confirmed', async () => {
    const { processor } = server([{
      status: 200,
      body: view('confirmed', {
        ledger: 5185778,
        autoSaved: { amount: 8.5, assetAmount: '1.1333334', verified: true },
        verification: { status: 'verified', legs: [
          { role: 'merchant', label: 'Campus Canteen', ok: true, assetAmount: '10.1999999' },
          { role: 'savings', label: 'Your savings', ok: true, assetAmount: '1.1333334' },
        ] },
      }),
    }]);
    const outcome = await processor.checkStatus(REQUEST.paymentId, HASH);
    expect(outcome).toMatchObject({
      status: 'confirmed',
      autoSaved: { amount: 8.5, assetAmount: '1.1333334', verified: true },
      merchantReceived: { label: 'Campus Canteen', assetAmount: '10.1999999' },
      verification: 'verified',
    });
  });

  it('a mismatched split is reported, with no merchant amount claimed', async () => {
    const { processor } = server([{
      status: 200,
      body: view('confirmed', { verification: { status: 'mismatch', legs: [{ role: 'merchant', label: 'Campus Canteen', ok: false, assetAmount: null }] } }),
    }]);
    const outcome = await processor.checkStatus(REQUEST.paymentId, HASH);
    expect(outcome.verification).toBe('mismatch');
    expect(outcome.merchantReceived).toBeUndefined();
  });

  it('the web-preview mock quotes the same split as the server', async () => {
    const { mockProcessor } = jest.requireActual('../processor') as typeof import('../processor');
    expect(await mockProcessor.quote(REQUEST)).toEqual({
      quoteId: `mock-${REQUEST.paymentId}`,
      split,
      autoSaved: { amount: 8.5, assetAmount: '1.1333334', verified: false },
    });
  });
});

describe('shortHash', () => {
  it('shortens Stellar and 0x hashes', () => {
    expect(shortHash(HASH)).toBe('94be…278d');
    expect(shortHash('0x7a3f00000000000000000000000000000000000000000000000000000000c91e')).toBe('0x7a3f…c91e');
    expect(shortHash('abc')).toBe('abc');
  });
});
