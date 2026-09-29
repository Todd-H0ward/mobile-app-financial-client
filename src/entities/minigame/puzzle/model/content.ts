import type { PuzzleLevel } from './types';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * First playable puzzle, opened by «Пазл «Арена»». The id predates the arena
 * picture and stays: saves keep it in `ownedItemIds`.
 */
export const PUZZLE_STUB: PuzzleLevel = {
  id: 'rooms-living',
  difficulty: 'easy',
  pack: 'rooms',
  imageKey: 'arena',
  cover: 'puzzle',
};

/**
 * Levels the arcade can open today. Every toy in the workshop opens the one
 * whose id matches its `ownedId`, so the harder pictures cost more.
 */
export const PUZZLE_CATALOGUE: readonly PuzzleLevel[] = [
  PUZZLE_STUB,
  {
    id: 'toy-bone',
    difficulty: 'easy',
    pack: 'toys',
    imageKey: 'bone',
    cover: 'toyBone',
  },
  {
    id: 'toy-ball',
    difficulty: 'easy',
    pack: 'toys',
    imageKey: 'ball',
    cover: 'toyBall',
  },
  {
    id: 'toy-yoyo',
    difficulty: 'medium',
    pack: 'toys',
    imageKey: 'yoyo',
    cover: 'toyYoyo',
  },
  {
    id: 'toy-frisbee',
    difficulty: 'medium',
    pack: 'toys',
    imageKey: 'frisbee',
    cover: 'toyFrisbee',
  },
  {
    id: 'toy-duck',
    difficulty: 'medium',
    pack: 'toys',
    imageKey: 'duck',
    cover: 'toyDuck',
  },
  {
    id: 'toy-cube',
    difficulty: 'hard',
    pack: 'toys',
    imageKey: 'cube',
    cover: 'toyCube',
  },
];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const puzzleById = (id: string): PuzzleLevel | undefined =>
  PUZZLE_CATALOGUE.find((level) => level.id === id);
