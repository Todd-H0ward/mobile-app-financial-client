import type { PuzzleLevel } from './types';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * First playable puzzle — room art until dedicated puzzle assets land.
 * One id keeps the sitting seed stable across launches.
 *
 * `id` matches the catalogue `furnitureId` so buying the toy unlocks this
 * level via `home.furnitureIds`.
 */
export const PUZZLE_STUB: PuzzleLevel = {
  id: 'rooms-living',
  difficulty: 'easy',
  pack: 'rooms',
  imageKey: 'living',
};

/** Levels the arcade can open today. */
export const PUZZLE_CATALOGUE: readonly PuzzleLevel[] = [PUZZLE_STUB];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const puzzleById = (id: string): PuzzleLevel | undefined =>
  PUZZLE_CATALOGUE.find((level) => level.id === id);
