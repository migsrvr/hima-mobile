import { AppState, type AppStateStatus } from 'react-native';
import { act, create } from 'react-test-renderer';

import { backend } from '@/services/backend';
import { useBackendReadiness } from '../useBackendReadiness';

jest.mock('@/services/backend', () => ({ backend: {
  ensureReady: jest.fn().mockResolvedValue(undefined),
  getStatus: () => 'ready',
  subscribe: () => () => {},
} }));

function Consumer() { useBackendReadiness(); return null; }

it('wakes at launch and on foreground, removes its listener, and does not wake for duplicate active events', async () => {
  const remove = jest.fn();
  let listener: (state: AppStateStatus) => void = () => {};
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    listener = callback;
    return { remove };
  });
  let root: ReturnType<typeof create>;
  await act(async () => { root = create(<Consumer />); });
  expect(backend.ensureReady).toHaveBeenCalledTimes(1);
  await act(async () => { listener('background'); listener('active'); listener('active'); });
  expect(backend.ensureReady).toHaveBeenCalledTimes(2);
  await act(async () => { root.unmount(); });
  expect(remove).toHaveBeenCalledTimes(1);
  jest.restoreAllMocks();
});
