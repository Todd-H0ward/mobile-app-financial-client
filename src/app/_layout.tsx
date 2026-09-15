import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { SplashOverlay } from '@/shared/ui';

import { Providers } from '@/_app/providers';

// The overlay hides it once the first screen has laid out.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }} />

      <SplashOverlay />
    </Providers>
  );
}
