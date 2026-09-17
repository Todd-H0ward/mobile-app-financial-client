import { PUZZLE_CATALOGUE } from './content';
import type { PuzzleLevel } from './types';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Levels unlocked by toys bought for the room.
 *
 * Ownership reuses `home.furnitureIds`: the catalogue SKU's `furnitureId`
 * matches the puzzle level `id` (e.g. `rooms-living`), so no second inventory.
 */
export const ownedPuzzles = (furnitureIds: readonly string[]): PuzzleLevel[] =>
  PUZZLE_CATALOGUE.filter((level) => furnitureIds.includes(level.id));

export const isPuzzleOwned = (
  furnitureIds: readonly string[],
  puzzleId: string,
): boolean => furnitureIds.includes(puzzleId);

export const hasOwnedPuzzles = (furnitureIds: readonly string[]): boolean =>
  ownedPuzzles(furnitureIds).length > 0;
