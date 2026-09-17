// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ArcadeScoresSave {
  /**
   * Top snake apple counts, highest first.
   * Written on cash-out; never empty-padded.
   */
  snake: number[];
  /**
   * Top Spacewar clear times in ms, fastest (lowest) first.
   * Written when a sitting is won.
   */
  spacewarMs: number[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** How many rows the LCD table keeps per game. */
export const ARCADE_SCORE_LIMIT = 5;

export const EMPTY_ARCADE_SCORES: ArcadeScoresSave = {
  snake: [],
  spacewarMs: [],
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Insert a snake score into the top list (higher apples win).
 * Returns a new array — never mutates the input.
 */
export const recordSnakeScore = (
  scores: readonly number[],
  apples: number,
): number[] => {
  if (!Number.isFinite(apples) || apples <= 0) return [...scores];
  const next = [...scores, Math.floor(apples)]
    .sort((a, b) => b - a)
    .slice(0, ARCADE_SCORE_LIMIT);
  return next;
};

/**
 * Insert a Spacewar clear time (lower ms wins).
 * Returns a new array — never mutates the input.
 */
export const recordSpacewarTime = (
  timesMs: readonly number[],
  elapsedMs: number,
): number[] => {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return [...timesMs];
  const next = [...timesMs, Math.floor(elapsedMs)]
    .sort((a, b) => a - b)
    .slice(0, ARCADE_SCORE_LIMIT);
  return next;
};

/** Format ms as `12с` / `1:05` for the LCD table. */
export const formatArcadeTime = (ms: number): string => {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export type { ArcadeScoresSave };
