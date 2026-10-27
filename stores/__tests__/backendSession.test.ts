import { setApiSession } from '@/services/api';
import { authService } from '@/services/auth';
import type { Session } from '@/types/user';

import { useSessionStore } from '../session';

jest.mock('@/services/api', () => ({ setApiSession: jest.fn() }));
jest.mock('@/services/auth', () => ({ authService: { restore: jest.fn(), renew: jest.fn(), logOut: jest.fn().mockResolvedValue(undefined) } }));

const local: Session = { token: '', user: { id: 'bea@example.com', email: 'bea@example.com', firstName: 'Bea', lastName: '' } };

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.setState({ session: null, status: 'signedOut' });
});

it('shares background renewal with first-request 401 renewal and installs its signed token', async () => {
  jest.mocked(authService.restore).mockResolvedValue(local);
  let finish: (session: Session) => void = () => {};
  jest.mocked(authService.renew).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  await useSessionStore.getState().restore();
  expect(useSessionStore.getState().status).toBe('signedIn');
  const renew = jest.mocked(setApiSession).mock.calls[0][1]!;
  const first = renew!();
  expect(renew!()).toBe(first);
  expect(authService.renew).toHaveBeenCalledTimes(1);
  finish({ ...local, token: 'signed.token' });
  await expect(first).resolves.toBe('signed.token');
  expect(useSessionStore.getState().session?.token).toBe('signed.token');
});

it('does not restore a signed-out account when a slow renewal finally completes', async () => {
  jest.mocked(authService.restore).mockResolvedValue(local);
  let finish: (session: Session) => void = () => {};
  jest.mocked(authService.renew).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  await useSessionStore.getState().restore();
  const current = jest.mocked(authService.renew).mock.calls[0][1]!;
  const renew = jest.mocked(setApiSession).mock.calls[0][1]!;
  const pending = renew!();
  await useSessionStore.getState().logOut();
  expect(current()).toBe(false);
  finish({ ...local, token: 'late.token' });
  await expect(pending).resolves.toBeNull();
  expect(useSessionStore.getState()).toMatchObject({ status: 'signedOut', session: null });
});
