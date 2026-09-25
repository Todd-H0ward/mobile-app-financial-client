// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type ClassicGameId = 'puzzle' | 'spacewar' | 'snake' | 'market' | 'weekly';

/** Overseer gesture games — not multiple-choice. */
type PlaykitGameId =
  | 'conveyor'
  | 'scales'
  | 'cashier'
  | 'jar'
  | 'pinball'
  | 'memory'
  | 'path'
  | 'assemble'
  | 'laser'
  | 'orbit';

type GameId = ClassicGameId | PlaykitGameId;

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

/** All gesture games the Overseer terminal lists. */
export const PLAYKIT_GAME_IDS: readonly PlaykitGameId[] = [
  'conveyor',
  'scales',
  'cashier',
  'jar',
  'pinball',
  'memory',
  'path',
  'assemble',
  'laser',
  'orbit',
] as const;

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
  conveyor: 7,
  scales: 7,
  cashier: 7,
  jar: 7,
  pinball: 7,
  memory: 7,
  path: 7,
  assemble: 7,
  laser: 7,
  orbit: 7,
};

/** Share of the reward kept on a wrong / incomplete-style miss. Never zero. */
export const WRONG_ROUND_SHARE = 0.5;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const isPlaykitGameId = (value: string): value is PlaykitGameId =>
  (PLAYKIT_GAME_IDS as readonly string[]).includes(value);

/**
 * Coins for one sitting. Always at least 1 — a silent zero reads as a bug.
 */
export const payoutFor = ({ gameId, isCorrect }: PayoutInput): number => {
  const full = GAME_REWARDS[gameId];
  const share = isCorrect ? 1 : WRONG_ROUND_SHARE;
  return Math.max(1, Math.round(full * share));
};

export type { ClassicGameId, GameId, PayoutInput, PlaykitGameId };
