// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type GameId = 'puzzle' | 'spacewar' | 'snake' | 'market' | 'weekly';

interface PayoutInput {
  gameId: GameId;
  /**
   * Whether the sitting was answered / finished correctly.
   * A miss still pays {@link WRONG_ROUND_SHARE} — nothing can be failed.
   */
  isCorrect: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Coins for a correct sitting. Kept under a medium chore on purpose — chores
 * must out-earn games (AGENTS.md arcade rules).
 */
export const GAME_REWARDS: Record<GameId, number> = {
  market: 8,
  weekly: 8,
  puzzle: 8,
  spacewar: 7,
  snake: 7,
};

/** Share of the reward kept on a wrong / incomplete-style miss. Never zero. */
export const WRONG_ROUND_SHARE = 0.5;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Coins for one sitting. Always at least 1 — a silent zero reads as a bug.
 */
export const payoutFor = ({ gameId, isCorrect }: PayoutInput): number => {
  const full = GAME_REWARDS[gameId];
  const share = isCorrect ? 1 : WRONG_ROUND_SHARE;
  return Math.max(1, Math.round(full * share));
};

export type { GameId, PayoutInput };
