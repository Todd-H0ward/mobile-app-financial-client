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
  /** The growth ceremony, pushed once `hasPendingGrowth` is true. */
  PET_GREW: '/pet-grew',
  BUDGET_PLAN: '/budget-plan',
  /** Soft confirm before freezing the active period — 0.3-R. */
  END_PERIOD: '/end-period',
  PERIOD_SUMMARY: '/period-summary',
  /** Choosable recovery steps after the period totals — 2.5.9. */
  RECOVERY: '/recovery',
  /** Dynamic shopfront — append `/${shopId}`. Prefer `shopPath`. */
  SHOP: '/shop',
  /** Savings showcase — every goal with progress. */
  SAVINGS: '/savings',
  /** Chores showcase — all six tasks for the period. */
  TASKS: '/tasks',
  /** Finished periods and named wallet lines — 2.5.11. */
  HISTORY: '/history',
  /** Child-facing glossary of money words — 2.5.11. */
  GLOSSARY: '/glossary',
  SETTINGS: '/settings',
  /** The grown-up's section, behind the arithmetic barrier — 2.5.12. */
  PARENTS: '/parents',
  UI_KIT: '/ui-kit',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * The growth ceremony's route, carrying where it hands the child back to —
 * home in the common case, the budget screen when growth interrupted the
 * recovery flow right after a period's plan was meant to continue.
 */
export const petGrewPath = (destination: RoutePath = ROUTES.HOME) =>
  ({
    pathname: '/pet-grew' as const,
    params: { destination },
  }) as const;

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
