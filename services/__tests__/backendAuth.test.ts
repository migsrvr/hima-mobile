import { useSessionStore } from '@/stores/session';

import { apiFetch, setApiSession } from '../api';
import { authService } from '../auth';
import { secureStorage } from '../secureStorage';

jest.mock('../api', () => ({ apiFetch: jest.fn(), setApiSession: jest.fn() }));
jest.mock('../secureStorage', () => ({ secureStorage: { set: jest.fn(), get: jest.fn(), remove: jest.fn() } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

let disk: string | null;
beforeEach(async () => {
  jest.useFakeTimers();
  disk = null;
  jest.mocked(secureStorage.set).mockReset().mockImplementation(async (_key, value) => { disk = value; });
  jest.mocked(secureStorage.get).mockReset().mockImplementation(async () => disk);
  jest.mocked(secureStorage.remove).mockReset().mockImplementation(async () => { disk = null; });
  await authService.logOut();
  jest.clearAllMocks();
  jest.mocked(apiFetch).mockReset().mockImplementation(() => new Promise(() => {}));
  useSessionStore.setState({ session: null, status: 'signedOut' });
});
afterEach(() => jest.useRealTimers());

it('opens a local demo session without waiting for hosted backend readiness', async () => {
  const session = authService.logIn('Bea.Reyes@example.com', 'password');
  await jest.advanceTimersByTimeAsync(600);
  await expect(session).resolves.toMatchObject({ token: '', user: { email: 'bea.reyes@example.com' } });
  expect(apiFetch).not.toHaveBeenCalled();
  expect(secureStorage.set).toHaveBeenCalledTimes(1);
});

async function logInLocal() {
  const login = useSessionStore.getState().logIn('bea@example.com', 'password');
  await jest.advanceTimersByTimeAsync(600);
  await login;
}

it('deletes a renewal write already in progress and invalidates memory/API immediately on logout', async () => {
  const token = deferred<{ token: string }>();
  jest.mocked(apiFetch).mockReturnValueOnce(token.promise);
  await logInLocal();
  const entered = deferred<void>();
  const finish = deferred<void>();
  jest.mocked(secureStorage.set).mockImplementationOnce(async (_key, value) => {
    entered.resolve(); await finish.promise; disk = value;
  });
  const renew = jest.mocked(setApiSession).mock.calls.find((call) => typeof call[1] === 'function')![1]!;
  const renewal = renew();
  token.resolve({ token: 'old.token' });
  await entered.promise;
  const logout = useSessionStore.getState().logOut();
  expect(useSessionStore.getState()).toMatchObject({ status: 'signedOut', session: null });
  expect(setApiSession).toHaveBeenLastCalledWith(null, null);
  expect(secureStorage.remove).not.toHaveBeenCalled();
  finish.resolve();
  await expect(renewal).resolves.toBeNull();
  await logout;
  expect(disk).toBeNull();
  await expect(authService.restore()).resolves.toBeNull();
});

it('serializes a started renewal write before another account replaces it', async () => {
  // Control the initial token rather than leave the startup renewal unresolved.
  const token = deferred<{ token: string }>();
  jest.mocked(apiFetch).mockReturnValueOnce(token.promise);
  await logInLocal();
  const entered = deferred<void>();
  const finish = deferred<void>();
  jest.mocked(secureStorage.set).mockImplementationOnce(async (_key, value) => {
    entered.resolve(); await finish.promise; disk = value;
  });
  const renew = jest.mocked(setApiSession).mock.calls.find((call) => typeof call[1] === 'function')![1]!;
  const renewal = renew();
  token.resolve({ token: 'old.token' });
  await entered.promise;
  const next = useSessionStore.getState().logIn('next@example.com', 'password');
  await jest.advanceTimersByTimeAsync(600);
  expect(useSessionStore.getState().session).toBeNull();
  finish.resolve();
  await expect(renewal).resolves.toBeNull();
  await next;
  expect(useSessionStore.getState().session?.user.email).toBe('next@example.com');
  expect(JSON.parse(disk!).user.email).toBe('next@example.com');
  expect(jest.mocked(setApiSession).mock.calls.filter((call) => call[0] === 'old.token')).toHaveLength(0);
});

it('discards local login whose persistence started before logout', async () => {
  const entered = deferred<void>();
  const finish = deferred<void>();
  jest.mocked(secureStorage.set).mockImplementationOnce(async (_key, value) => {
    entered.resolve(); await finish.promise; disk = value;
  });
  const login = useSessionStore.getState().logIn('bea@example.com', 'password').catch((error) => error);
  await jest.advanceTimersByTimeAsync(600);
  await entered.promise;
  const logout = useSessionStore.getState().logOut();
  finish.resolve();
  expect(await login).toBeInstanceOf(Error);
  await logout;
  expect(useSessionStore.getState().session).toBeNull();
  expect(disk).toBeNull();
});
