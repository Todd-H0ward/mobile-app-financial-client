import * as Localization from 'expo-localization';
import i18n, { changeLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { AppLanguage, LanguagePreference } from '@/shared/types';

import en from './locales/en.json';
import ru from './locales/ru.json';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const SUPPORTED_LANGUAGES = ['en', 'ru'] as const;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const getSystemLanguage = (): AppLanguage => {
  const languageTag = Localization.getLocales()[0]?.languageTag ?? 'en';
  const shortCode = languageTag.split('-')[0];

  return SUPPORTED_LANGUAGES.includes(shortCode as AppLanguage)
    ? (shortCode as AppLanguage)
    : 'en';
};

export const resolveLanguagePreference = (
  preference: LanguagePreference,
): AppLanguage => {
  return preference === 'system' ? getSystemLanguage() : preference;
};

export const applyLanguagePreference = async (
  preference: LanguagePreference,
) => {
  const language = resolveLanguagePreference(preference);

  if (language !== i18n.language) await changeLanguage(language);
};

// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    ru: {
      translation: ru,
    },
  },
  lng: getSystemLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export { useTranslation } from 'react-i18next';
export default i18n;
