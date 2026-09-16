import { useEffect } from 'react';

import {
  applyLanguagePreference,
  resolveLanguagePreference,
} from '@/shared/i18n';
import { useLanguagePreference } from '@/shared/model';

/**
 * Keeps i18next on the language the preferences ask for.
 *
 * Mount it once, above the app: the preference is the source of truth and
 * i18next only follows it, so nothing has to remember to call `changeLanguage`.
 */
export const useAppLanguage = () => {
  const preference = useLanguagePreference();

  useEffect(() => {
    applyLanguagePreference(preference);
  }, [preference]);

  return resolveLanguagePreference(preference);
};
