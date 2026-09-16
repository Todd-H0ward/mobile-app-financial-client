import { applyLanguagePreference } from '@/shared/i18n';
import {
  useLanguagePreference,
  useSetLanguagePreference,
} from '@/shared/model';
import type { LanguagePreference } from '@/shared/types';

// ═══════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════

/**
 * Exposes the current language preference and a setter that persists it and
 * immediately applies it to i18next.
 *
 * `useAppLanguage` (mounted once in Providers) keeps i18next in sync on mount
 * and on every re-render. This hook only covers the moment the user taps a
 * language button: we call `applyLanguagePreference` eagerly so the UI
 * switches before the next render cycle, without waiting for the effect.
 */
export const useChangeLanguage = () => {
  const languagePreference = useLanguagePreference();
  const setLanguagePreference = useSetLanguagePreference();

  const changeLanguage = (preference: LanguagePreference) => {
    setLanguagePreference(preference);
    applyLanguagePreference(preference);
  };

  return { languagePreference, changeLanguage };
};
