import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemePreference } from '@/shared/model';

/** Saved preference wins; `'system'` falls back to device (light if unset). */
export const useColorScheme = (): 'light' | 'dark' => {
  const preference = useThemePreference();
  const system = useSystemColorScheme();

  if (preference !== 'system') return preference;

  // Device `'unspecified'` → light.
  return system === 'dark' ? 'dark' : 'light';
};
