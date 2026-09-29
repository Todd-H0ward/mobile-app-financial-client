import { describe, expect, it } from 'vitest';

import { SPRITE_PALETTE } from '../palette';

import { isSceneName, PUZZLE_SCENES } from './scenes';

describe('the puzzle scenes', () => {
  it('are square 48×48, like the puzzle board', () => {
    for (const [name, rows] of Object.entries(PUZZLE_SCENES)) {
      expect({ name, height: rows.length }).toEqual({ name, height: 48 });
      for (const row of rows) {
        expect({ name, width: row.length }).toEqual({ name, width: 48 });
      }
    }
  });

  it('are fully painted: a puzzle piece may not be see-through', () => {
    const inks = new Set(Object.keys(SPRITE_PALETTE));
    for (const [name, rows] of Object.entries(PUZZLE_SCENES)) {
      const holes = [...rows.join('')].filter((ink) => !inks.has(ink));
      expect({ name, holes: holes.length }).toEqual({ name, holes: 0 });
    }
  });

  it('are all different pictures', () => {
    const pictures = Object.values(PUZZLE_SCENES).map((rows) => rows.join());
    expect(new Set(pictures).size).toBe(pictures.length);
  });

  it('are found by name', () => {
    expect(isSceneName('ball')).toBe(true);
    expect(isSceneName('living')).toBe(false);
  });
});
