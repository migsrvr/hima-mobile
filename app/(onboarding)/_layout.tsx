import { Stack } from 'expo-router';

import { RequireSession } from '@/components/ui/RequireSession';

export default function OnboardingLayout() {
  return (
    <RequireSession>
      <Stack screenOptions={{ headerShown: false }} />
    </RequireSession>
  );
}
