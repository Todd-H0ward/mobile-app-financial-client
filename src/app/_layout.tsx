import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { Providers } from '@/_app/providers';

import { COLORS, LESSON_FADE_MS, SHEET_ROUTE_NAMES } from '@/shared/constants';
import { SplashOverlay } from '@/shared/ui';

// The overlay hides it once the first screen has laid out.
SplashScreen.preventAutoHideAsync();

/** transparentModal keeps home's GL surface alive underneath. */
const SHEET_OPTIONS = {
  animation: 'fade',
  contentStyle: { backgroundColor: 'transparent' },
  presentation: 'transparentModal',
} as const;

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        {SHEET_ROUTE_NAMES.map((name) => (
          <Stack.Screen key={name} name={name} options={SHEET_OPTIONS} />
        ))}
        <Stack.Screen
          name="lesson/[cellId]"
          options={{
            animation: 'fade',
            animationDuration: LESSON_FADE_MS,
            contentStyle: { backgroundColor: COLORS.light.terminalScreen },
          }}
        />
      </Stack>

      <SplashOverlay />
    </Providers>
  );
}
