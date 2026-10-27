import { CloudOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBackendReadiness } from '@/hooks/useBackendReadiness';
import { colors, space, type } from '@/theme';

import { HimaButton } from './HimaButton';
import { Spinner } from './Spinner';
import { Text } from './Text';

/** Takes layout space so the budget and navigation remain reachable. */
export function BackendReadinessBanner() {
  const { status, retry } = useBackendReadiness();
  const insets = useSafeAreaInsets();
  if (status === 'ready' || status === 'idle') return null;
  const connecting = status === 'connecting';
  return (
    <View style={[styles.banner, { paddingTop: insets.top + space[8] }]}>
      <View style={styles.message} accessibilityLiveRegion="polite">
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {connecting ? <Spinner size={20} color={colors.blueText} /> : <CloudOff size={20} color={colors.blueText} />}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{connecting ? 'Connecting to Hima…' : 'Hima server unavailable'}</Text>
          <Text style={styles.detail}>{connecting ? 'This may take up to two minutes. Your local budget is available.' : 'Keep using your local budget. Check your connection and retry.'}</Text>
        </View>
      </View>
      {!connecting && <HimaButton label="Retry" accessibilityLabel="Retry connecting to Hima" onPress={retry} variant="text" size="md" />}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.backgroundSecondary, paddingHorizontal: space[16], paddingBottom: space[8], gap: space[4] },
  message: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  copy: { flex: 1 },
  title: { ...type.supporting, color: colors.blueText },
  detail: { ...type.supporting, color: colors.textSecondary },
});
