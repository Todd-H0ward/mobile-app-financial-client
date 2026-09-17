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
  /** Dynamic shopfront — append `/${shopId}`. Prefer `shopPath`. */
  SHOP: '/shop',
  /** Savings showcase — every goal with progress. */
  SAVINGS: '/savings',
  /** Chores showcase — all six tasks for the period. */
  TASKS: '/tasks',
  SETTINGS: '/settings',
  UI_KIT: '/ui-kit',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Route into one of the four street shops. */
export const shopPath = (shopId: string) => `${ROUTES.SHOP}/${shopId}` as const;

/** Route into one savings goal's jar. */
export const goalPath = (goalId: string) =>
  ({
    pathname: '/savings/[goalId]' as const,
    params: { goalId },
  }) as const;

/** Confirm screen before taking coins out of a goal's jar. */
export const withdrawPath = (goalId: string, amount: number) =>
  ({
    pathname: '/savings/withdraw' as const,
    params: { goalId, amount: String(amount) },
  }) as const;

/** Route into one chore's play screen. */
export const taskPath = (taskId: string) =>
  ({
    pathname: '/tasks/[taskId]' as const,
    params: { taskId },
  }) as const;
