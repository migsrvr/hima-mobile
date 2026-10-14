import { Tabs } from 'expo-router';

import { RequireSession } from '@/components/ui/RequireSession';
import { HimaTabBar } from '@/components/ui/TabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <RequireSession>
      <Tabs
        tabBar={(props) => <HimaTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
        }}>
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
        <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </RequireSession>
  );
}
