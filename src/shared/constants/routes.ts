/**
 * Application routes.
 *
 * Centralised route registry used across navigation calls and redirects.
 */
export const ROUTES = {
  ENTRY: '/',
  HOME: '/home',
  ONBOARDING: '/onboarding',
  PET_CREATE: '/pet-create',
  SETTINGS: '/settings',
  UI_KIT: '/ui-kit',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
