import type { BoardSize, PuzzleDifficulty } from './types';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Grid sizes per difficulty. Kept small enough for a phone cell; the web
 * catalogue went higher, but tabs become unreadable past ~7×7 on a handset.
 */
export const DIFFICULTY_BOARD: Record<PuzzleDifficulty, BoardSize> = {
  easy: { count: 9, cols: 3 },
  medium: { count: 16, cols: 4 },
  hard: { count: 25, cols: 5 },
  expert: { count: 36, cols: 6 },
  master: { count: 49, cols: 7 },
};

export const PUZZLE_DIFFICULTIES = [
  'easy',
  'medium',
  'hard',
  'expert',
  'master',
] as const satisfies readonly PuzzleDifficulty[];
