import { describe, expect, it } from 'vitest';

import { listCatalogue } from '@/entities/catalogue';
import { isSceneName, isSpriteName } from '@/entities/sprite';

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

  it('has unique ids', () => {
    const ids = PUZZLE_CATALOGUE.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('draws every level from a scene and gives it a cover', () => {
    for (const level of PUZZLE_CATALOGUE) {
      expect({ id: level.id, isScene: isSceneName(level.imageKey) }).toEqual({
        id: level.id,
        isScene: true,
      });
      expect(isSpriteName(level.cover)).toBe(true);
    }
  });

  it('opens every level with a toy from the workshop, and every toy opens one', () => {
    const toys = listCatalogue().filter((item) => item.category === 'toy');
    const opened = toys.map((item) => item.ownedId);
    for (const level of PUZZLE_CATALOGUE) {
      expect(opened).toContain(level.id);
    }
    for (const toy of toys) {
      expect(puzzleById(toy.ownedId ?? '')?.id).toBe(toy.ownedId);
    }
  });
});
