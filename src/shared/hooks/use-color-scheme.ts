import { useColorScheme as useSystemColorScheme } from 'react-native';

import { usePreferencesStore } from '@/shared/model';

/**
 * The scheme the app actually paints with.
 *
 * The saved preference wins over the device; `'system'` — the default — falls
 * back to the device appearance, and to light when it says nothing.
 */
export const useColorScheme = (): 'light' | 'dark' => {
  const preference = usePreferencesStore((state) => state.themePreference);
  const system = useSystemColorScheme();

  if (preference !== 'system') return preference;

  // The device says `'unspecified'` when it has no opinion — that is light.
  return system === 'dark' ? 'dark' : 'light';
};
