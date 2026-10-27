import { act, create } from 'react-test-renderer';

import { useBackendReadiness } from '@/hooks/useBackendReadiness';
import { BackendReadinessBanner } from '../BackendReadinessBanner';
import { HimaButton } from '../HimaButton';
import { Text } from '../Text';

jest.mock('@/hooks/useBackendReadiness', () => ({ useBackendReadiness: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }));
jest.mock('lucide-react-native', () => ({ CloudOff: () => null }));
jest.mock('../Spinner', () => ({ Spinner: () => null }));

const mockedReadiness = jest.mocked(useBackendReadiness);

it('shows connecting, offers an accessible retry on failure, and disappears when healthy', async () => {
  const retry = jest.fn();
  mockedReadiness.mockReturnValue({ status: 'connecting', retry });
  let root: ReturnType<typeof create>;
  await act(async () => { root = create(<BackendReadinessBanner />); });
  expect(root!.root.findAllByType(Text).map((node) => node.props.children)).toContain('Connecting to Hima…');
  expect(root!.root.findAllByType(HimaButton)).toHaveLength(0);
  mockedReadiness.mockReturnValue({ status: 'unavailable', retry });
  await act(async () => { root!.update(<BackendReadinessBanner />); });
  const button = root!.root.findByType(HimaButton);
  expect(button.props.accessibilityLabel).toBe('Retry connecting to Hima');
  await act(async () => { button.props.onPress(); });
  expect(retry).toHaveBeenCalledTimes(1);
  mockedReadiness.mockReturnValue({ status: 'ready', retry });
  await act(async () => { root!.update(<BackendReadinessBanner />); });
  expect(root!.toJSON()).toBeNull();
  await act(async () => { root!.unmount(); });
}, 30_000);
