import { Redirect } from 'expo-router';

import { SplashView } from '@/components/ui/SplashView';

/** Dev-only: the splash artwork without the redirect, for comparing with 01-Splash.html. */
export default function SplashPreview() {
  if (!__DEV__) return <Redirect href="/" />;
  return <SplashView />;
}
