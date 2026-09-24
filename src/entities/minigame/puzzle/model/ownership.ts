import { PUZZLE_CATALOGUE } from './content';
import type { PuzzleLevel } from './types';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Levels unlocked by toys bought for the room.
 *
 * Ownership reuses `ownedItemIds`: the catalogue SKU's `ownedId`
 * matches the puzzle level `id` (e.g. `rooms-living`), so no second inventory.
 */
export const ownedPuzzles = (ownedItemIds: readonly string[]): PuzzleLevel[] =>
  PUZZLE_CATALOGUE.filter((level) => ownedItemIds.includes(level.id));

export const isPuzzleOwned = (
  ownedItemIds: readonly string[],
  puzzleId: string,
): boolean => ownedItemIds.includes(puzzleId);

export const hasOwnedPuzzles = (ownedItemIds: readonly string[]): boolean =>
  ownedPuzzles(ownedItemIds).length > 0;
