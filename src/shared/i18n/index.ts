import * as Localization from 'expo-localization';
import i18n, { changeLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { AppLanguage, LanguagePreference } from '@/shared/types';

import { formatNoun, type NounForms } from './noun';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const SUPPORTED_LANGUAGES = ['en', 'ru'] as const;

/** Lazy loaders — only the active language is parsed at startup (~60 KB saved). */
const LOCALE_LOADERS: Record<AppLanguage, () => Record<string, string>> = {
  en: () => require('./locales/en.json'),
  ru: () => require('./locales/ru.json'),
};

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

/** Ensure the bundle for `lang` is registered before switching. */
const ensureLocale = (lang: AppLanguage) => {
  if (!i18n.hasResourceBundle(lang, 'translation')) {
    i18n.addResourceBundle(lang, 'translation', LOCALE_LOADERS[lang]());
  }
};

export const applyLanguagePreference = async (
  preference: LanguagePreference,
) => {
  const language = resolveLanguagePreference(preference);
  ensureLocale(language);
  if (language !== i18n.language) await changeLanguage(language);
};

// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════

const startLanguage = getSystemLanguage();
const fallback: AppLanguage = 'en';

i18n.use(initReactI18next).init({
  resources: {
    [startLanguage]: {
      translation: LOCALE_LOADERS[startLanguage](),
    },
    // Load fallback only if it differs from the start language.
    ...(startLanguage !== fallback && {
      [fallback]: {
        translation: LOCALE_LOADERS[fallback](),
      },
    }),
  },
  lng: startLanguage,
  fallbackLng: fallback,
  interpolation: {
    escapeValue: false,
  },
});

/**
 * `{{count, noun(one: монета; few: монеты; many: монет)}}` — the word agrees with the number.
 * The forms live in the string, so each phrase picks its own case: "не хватает 21 монеты",
 * "ты получил 21 монету", "уйдёт 21 монета".
 */
i18n.services.formatter?.add('noun', (value, language, options) =>
  formatNoun(value, language ?? i18n.language, options as NounForms),
);

export { useTranslation } from 'react-i18next';

export { formatNoun } from './noun';
export default i18n;
