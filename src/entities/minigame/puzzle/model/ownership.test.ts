import { describe, expect, it } from 'vitest';

import { PUZZLE_STUB } from './content';
import { hasOwnedPuzzles, isPuzzleOwned, ownedPuzzles } from './ownership';

describe('ownedPuzzles', () => {
  it('returns nothing until the owned id is bought', () => {
    expect(ownedPuzzles([])).toEqual([]);
    expect(ownedPuzzles(['toy-car', 'ball'])).toEqual([]);
    expect(hasOwnedPuzzles([])).toBe(false);
  });

  it('unlocks the stub when rooms-living is owned', () => {
    expect(ownedPuzzles(['rooms-living'])).toEqual([PUZZLE_STUB]);
    expect(isPuzzleOwned(['rooms-living'], PUZZLE_STUB.id)).toBe(true);
    expect(hasOwnedPuzzles(['rug', 'rooms-living'])).toBe(true);
  });
});
