import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { Providers } from '@/_app/providers';

import {
  LESSON_FADE_MS,
  SHEET_ROUTE_NAMES,
  TERMINAL,
} from '@/shared/constants';
import { SplashOverlay } from '@/shared/ui';

// The overlay hides it once the first screen has laid out.
SplashScreen.preventAutoHideAsync();

/**
 * A transparent modal keeps the home screen attached underneath, so its GL
 * surface survives and coming back does not flash an empty frame.
 */
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
            contentStyle: { backgroundColor: TERMINAL.void },
          }}
        />
      </Stack>

      <SplashOverlay />
    </Providers>
  );
}
