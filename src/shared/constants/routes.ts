export const STATIC_ROUTES = {
  ENTRY: '/',
  HOME: '/home',
  ONBOARDING: '/onboarding',
  PET_CREATE: '/pet-create',
  PET_GREW: '/pet-grew',
  BUDGET_PLAN: '/budget-plan',
  END_PERIOD: '/end-period',
  PERIOD_SUMMARY: '/period-summary',
  RECOVERY: '/recovery',
  SHOP: '/shop',
  SAVINGS: '/savings',
  TASKS: '/tasks',
  GAMES: '/games',
  GAMES_CONSOLE: '/games/console',
  GAMES_SPACEWAR: '/games/spacewar',
  GAMES_SNAKE: '/games/snake',
  HISTORY: '/history',
  GLOSSARY: '/glossary',
  HEATING: '/heating',
  SETTINGS: '/settings',
  PARENTS: '/parents',
  UI_KIT: '/ui-kit',
} as const;

export type RoutePath = (typeof STATIC_ROUTES)[keyof typeof STATIC_ROUTES];

export const DYNAMIC_ROUTES = {
  shop: (shopId: string) => `${STATIC_ROUTES.SHOP}/${shopId}` as const,
  petGrew: (destination: RoutePath = STATIC_ROUTES.HOME) =>
    ({
      pathname: '/pet-grew' as const,
      params: { destination },
    }) as const,
  goal: (goalId: string) =>
    ({
      pathname: '/savings/[goalId]' as const,
      params: { goalId },
    }) as const,
  withdraw: (goalId: string, amount: number) =>
    ({
      pathname: '/savings/withdraw' as const,
      params: { goalId, amount: String(amount) },
    }) as const,
  task: (taskId: string) =>
    ({
      pathname: '/tasks/[taskId]' as const,
      params: { taskId },
    }) as const,
  puzzle: (puzzleId: string) =>
    ({
      pathname: '/games/puzzle/[puzzleId]' as const,
      params: { puzzleId },
    }) as const,
};
