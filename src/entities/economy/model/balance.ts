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

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TaskDifficulty = keyof typeof TASK_REWARD;

export type { TaskDifficulty };
