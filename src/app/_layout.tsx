import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { Providers } from '@/_app/providers';

import { SplashOverlay } from '@/shared/ui';

// The overlay hides it once the first screen has laid out.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>

      <SplashOverlay />
    </Providers>
  );
}
