import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { Providers } from '@/_app/providers';

import { LESSON_FADE_MS, TERMINAL } from '@/shared/constants';
import { SplashOverlay } from '@/shared/ui';

// The overlay hides it once the first screen has laid out.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="lesson/[cellId]"
          options={{
            animation: 'fade',
            animationDuration: LESSON_FADE_MS,
            contentStyle: { backgroundColor: TERMINAL.void },
          }}
        />
      </Stack>

      <SplashOverlay />
    </Providers>
  );
}
