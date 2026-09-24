import { describe, expect, it } from 'vitest';

import { PUZZLE_CATALOGUE, PUZZLE_STUB, puzzleById } from './content';

describe('puzzle catalogue', () => {
  it('ships at least the living-room stub', () => {
    expect(PUZZLE_CATALOGUE).toContainEqual(PUZZLE_STUB);
    expect(PUZZLE_STUB.id).toBe('rooms-living');
  });

  it('finds levels by owned id', () => {
    expect(puzzleById('rooms-living')).toEqual(PUZZLE_STUB);
    expect(puzzleById('missing')).toBeUndefined();
  });
});
