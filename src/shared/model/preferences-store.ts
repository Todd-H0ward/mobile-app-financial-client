import { create } from 'zustand';

import type { LanguagePreference, ThemePreference } from '@/shared/types';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PreferencesStore {
  /**
   * Appearance the user picked. `'system'` — the default — follows the device;
   * `useColorScheme()` turns this into the scheme actually painted.
   */
  themePreference: ThemePreference;
  /**
   * Language the user picked. `'system'` — the default — follows the device
   * locale, falling back to `en` for anything but `ru`.
   */
  languagePreference: LanguagePreference;
  /** Switches the appearance. Persisted once storage is wired up. */
  setThemePreference: (themePreference: ThemePreference) => void;
  /** Switches the language; `useAppLanguage()` pushes it into i18next. */
  setLanguagePreference: (languagePreference: LanguagePreference) => void;
}

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════

/**
 * Device-level preferences: appearance and language.
 *
 * Not persisted yet — `@react-native-async-storage/async-storage` is not a
 * dependency of the project, so the `persist` middleware has nothing to write
 * to. Both fields fall back to `'system'`, which is the correct cold start
 * anyway; add the middleware here once the package lands.
 */
export const usePreferencesStore = create<PreferencesStore>((set) => ({
  themePreference: 'system',
  languagePreference: 'system',
  setThemePreference: (themePreference) => set({ themePreference }),
  setLanguagePreference: (languagePreference) => set({ languagePreference }),
}));

export type { PreferencesStore };
