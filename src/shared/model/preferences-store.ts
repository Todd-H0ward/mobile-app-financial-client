import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/shared/constants';
import type { LanguagePreference, ThemePreference } from '@/shared/types';

import { createPersistStorage } from './persist-storage';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PreferencesPersistedState {
  /** Appearance the user picked, or `'system'`. */
  themePreference: ThemePreference;
  /** Language the user picked, or `'system'`. */
  languagePreference: LanguagePreference;
}

interface PreferencesStore extends PreferencesPersistedState {
  /** Switches the appearance. `persist` writes it through on the same call. */
  setThemePreference: (themePreference: ThemePreference) => void;
  /** Switches the language; `useAppLanguage()` pushes it into i18next. */
  setLanguagePreference: (languagePreference: LanguagePreference) => void;
}

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      themePreference: 'system',
      languagePreference: 'system',
      setThemePreference: (themePreference) => set({ themePreference }),
      setLanguagePreference: (languagePreference) =>
        set({ languagePreference }),
    }),
    {
      name: STORAGE_KEYS.PREFERENCES,
      storage: createPersistStorage<PreferencesPersistedState>(),
      partialize: ({ themePreference, languagePreference }) => ({
        themePreference,
        languagePreference,
      }),
    },
  ),
);

// ═══════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════

export const useThemePreference = () =>
  usePreferencesStore((state) => state.themePreference);

export const useLanguagePreference = () =>
  usePreferencesStore((state) => state.languagePreference);

export const useSetThemePreference = () =>
  usePreferencesStore((state) => state.setThemePreference);

export const useSetLanguagePreference = () =>
  usePreferencesStore((state) => state.setLanguagePreference);

export type { PreferencesPersistedState, PreferencesStore };
