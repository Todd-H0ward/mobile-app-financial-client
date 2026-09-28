import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { Providers } from '@/_app/providers';

import {
  ARENA_COVER_ROUTE_NAMES,
  COLORS,
  LESSON_FADE_MS,
  SHEET_ROUTE_NAMES,
} from '@/shared/constants';
import { SplashOverlay } from '@/shared/ui';

// The overlay hides it once the first screen has laid out.
SplashScreen.preventAutoHideAsync();

/** transparentModal keeps home's GL surface alive underneath. */
const SHEET_OPTIONS = {
  animation: 'fade',
  contentStyle: { backgroundColor: 'transparent' },
  presentation: 'transparentModal',
} as const;

/**
 * Same keep-alive as sheets, but opaque — lessons and games fully cover the
 * pit and `isArenaCovered` still pauses the loop. A default card push would
 * detach home and force expo-gl to rebuild the whole arena on the way back.
 */
const ARENA_COVER_OPTIONS = {
  animation: 'fade',
  animationDuration: LESSON_FADE_MS,
  contentStyle: { backgroundColor: COLORS.light.terminalScreen },
  presentation: 'transparentModal',
} as const;

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        {SHEET_ROUTE_NAMES.map((name) => (
          <Stack.Screen key={name} name={name} options={SHEET_OPTIONS} />
        ))}
        {ARENA_COVER_ROUTE_NAMES.map((name) => (
          <Stack.Screen key={name} name={name} options={ARENA_COVER_OPTIONS} />
        ))}
      </Stack>

      <SplashOverlay />
    </Providers>
  );
}
