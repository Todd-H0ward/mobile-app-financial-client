import { applyLanguagePreference } from '@/shared/i18n';
import {
  useLanguagePreference,
  useSetLanguagePreference,
} from '@/shared/model';
import type { LanguagePreference } from '@/shared/types';

// ═══════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════

/** Eager apply on tap — do not wait for `useAppLanguage`'s effect. */
export const useChangeLanguage = () => {
  const languagePreference = useLanguagePreference();
  const setLanguagePreference = useSetLanguagePreference();

  const changeLanguage = (preference: LanguagePreference) => {
    setLanguagePreference(preference);
    applyLanguagePreference(preference);
  };

  return { languagePreference, changeLanguage };
};
