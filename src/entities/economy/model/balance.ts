// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Starting wallet, in coins. Credited once when a profile is created.
 * See docs/economy.md.
 */
export const STARTING_BALANCE = 50;

/**
 * Task payout by difficulty. The content file stores `difficulty`, never a
 * raw coin amount — changing the table here rebalances every task at once.
 */
export const TASK_REWARD = {
  easy: 10,
  medium: 18,
  hard: 25,
} as const;

/** Coins added by the settlement step when the child deposited at least once. */
export const REGULARITY_BONUS = 5;

/**
 * How many wallet operations the save keeps. History is a report for the
 * grown-up, not an archive — the save must not grow without a bound.
 */
export const WALLET_HISTORY_LIMIT = 100;

/**
 * How close fact may sit to plan before the summary calls a direction "on
 * plan". Zero means exact coins — see docs/budget.md. Named so a playtest
 * can widen it without hunting through screens.
 */
export const BUDGET_TOLERANCE = 0;

/**
 * Source ids for wallet entries that name a rule rather than one task or
 * purchase — 2.5.4 bans a nameless credit, and a hand-typed string is one typo
 * from becoming one. `task:<id>` and `purchase:<id>` sources come from the
 * task engine and the catalogue instead, once those exist, and carry their own
 * title from content — they have no place in this table.
 */
export const WALLET_SOURCES = {
  /** The wallet a profile starts with, credited once at creation. */
  startingWallet: 'wallet:starting',
  /** Credited at settlement when the child deposited at least once. */
  regularityBonus: 'bonus:regularity',
} as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TaskDifficulty = keyof typeof TASK_REWARD;

export type { TaskDifficulty };
