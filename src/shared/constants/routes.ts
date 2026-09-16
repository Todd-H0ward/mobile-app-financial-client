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
  BUDGET_PLAN: '/budget-plan',
  PERIOD_SUMMARY: '/period-summary',
  SETTINGS: '/settings',
  UI_KIT: '/ui-kit',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
