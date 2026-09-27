import { useEffect } from 'react';

import {
  applyLanguagePreference,
  resolveLanguagePreference,
} from '@/shared/i18n';
import { useLanguagePreference } from '@/shared/model';

/** Mount once: preference is source of truth; i18next follows it. */
export const useAppLanguage = () => {
  const preference = useLanguagePreference();

  useEffect(() => {
    applyLanguagePreference(preference);
  }, [preference]);

  return resolveLanguagePreference(preference);
};
