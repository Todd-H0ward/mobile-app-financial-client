import type { Lang } from './lang';

export type AppLanguage = Lang;

export type LanguagePreference = AppLanguage | 'system';

export type ThemePreference = 'dark' | 'light' | 'system';
