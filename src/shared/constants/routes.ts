export const STATIC_ROUTES = {
  ENTRY: '/',
  HOME: '/home',
  ROBOT: '/robot',
  MODULES: '/modules',
  BUDGET_PLAN: '/budget-plan',
  END_PERIOD: '/end-period',
  PERIOD_SUMMARY: '/period-summary',
  RECOVERY: '/recovery',
  /** Deep-link alias — redirects into the Keeper terminal shop page. */
  SHOP: '/shop',
  GAMES_MARKET: '/games/market',
  GAMES_WEEKLY: '/games/weekly',
  SAVINGS: '/savings',
  TASKS: '/tasks',
  GAMES: '/games',
  GAMES_CONSOLE: '/games/console',
  GAMES_SPACEWAR: '/games/spacewar',
  GAMES_SNAKE: '/games/snake',
  HISTORY: '/history',
  GLOSSARY: '/glossary',
  SETTINGS: '/settings',
  SETUP: '/setup',
  PARENTS: '/parents',
  UI_KIT: '/ui-kit',
} as const;

export type RoutePath = (typeof STATIC_ROUTES)[keyof typeof STATIC_ROUTES];

export const DYNAMIC_ROUTES = {
  shop: (shopId: string) => `${STATIC_ROUTES.SHOP}/${shopId}` as const,
  /** Opens home on the dog's close-up with the diagnostics docked below. */
  robotPanel: () =>
    ({
      pathname: '/home' as const,
      params: { panel: 'robot' },
    }) as const,
  /** Opens home focused on a watcher terminal page. */
  watcher: (watcher: 'keeper' | 'overseer', page?: string) =>
    ({
      pathname: '/home' as const,
      params: page ? { watcher, page } : { watcher },
    }) as const,
  story: (cutsceneId: string) =>
    ({
      pathname: '/story/[cutsceneId]' as const,
      params: { cutsceneId },
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
  lesson: (cellId: string) =>
    ({
      pathname: '/lesson/[cellId]' as const,
      params: { cellId },
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
  play: (gameId: string) =>
    ({
      pathname: '/games/play/[gameId]' as const,
      params: { gameId },
    }) as const,
};

/**
 * Routes shown as a terminal sheet over the live pit (`transparentModal`).
 * Names are expo-router file routes; `isSheetPath` matches their URLs.
 */
export const SHEET_ROUTE_NAMES = [
  'settings',
  'history',
  'glossary',
  'modules',
  'end-period',
  'savings/index',
  'savings/[goalId]',
  'savings/withdraw',
  'tasks/[taskId]',
] as const;

const SHEET_PATH_PATTERNS = SHEET_ROUTE_NAMES.map(
  (name) =>
    new RegExp(
      `^/${name.replace(/\/index$/, '').replace(/\[[^\]]+\]/g, '[^/]+')}$`,
    ),
);

/** Whether a pathname is one of the sheets — the arena stays in view. */
export const isSheetPath = (pathname: string): boolean =>
  SHEET_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
