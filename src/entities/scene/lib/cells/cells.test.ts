import { describe, expect, it } from 'vitest';

import { SCENE_CELLS_PER_STEP } from '../../model';
import { arenaLayout, FULL_ARENA_LAYOUT } from '../layout';

import {
  cellFraction,
  cellFromKey,
  cellKey,
  cellOfFace,
  cellOrdinal,
} from './cells';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('cellOfFace', () => {
  /** Six cells of ten triangles each — the shape a merged terrace has. */
  const starts = [0, 10, 20, 30, 40, 50];

  it('finds the cell a triangle falls in', () => {
    expect(cellOfFace(starts, 0)).toBe(0);
    expect(cellOfFace(starts, 9)).toBe(0);
    expect(cellOfFace(starts, 10)).toBe(1);
    expect(cellOfFace(starts, 55)).toBe(5);
  });

  it('answers for cells of unequal size', () => {
    expect(cellOfFace([0, 4, 5], 4)).toBe(1);
    expect(cellOfFace([0, 4, 5], 12)).toBe(2);
  });

  it('has no answer for a ray that landed elsewhere', () => {
    expect(cellOfFace(starts, -1)).toBeNull();
    expect(cellOfFace([], 3)).toBeNull();
    expect(cellOfFace([7, 12], 3)).toBeNull();
  });
});

describe('cellFraction', () => {
  it('runs end to end across the arc', () => {
    expect(cellFraction(0)).toBe(0);
    expect(cellFraction(SCENE_CELLS_PER_STEP - 1)).toBe(1);
  });

  it('spaces the cells evenly', () => {
    expect(cellFraction(1) - cellFraction(0)).toBeCloseTo(
      cellFraction(3) - cellFraction(2),
      10,
    );
  });
});

describe('cellOrdinal', () => {
  it('numbers the whole arena without a gap or a collision', () => {
    const seen = new Set<number>();

    for (let segment = 0; segment < 3; segment += 1) {
      for (let step = 0; step < 5; step += 1) {
        for (let cell = 0; cell < 20; cell += 1) {
          const ordinal = cellOrdinal({ segment, step, cell });
          if (ordinal !== null) seen.add(ordinal);
        }
      }
    }

    expect(seen.size).toBe(90);
    expect(Math.min(...seen)).toBe(0);
    expect(Math.max(...seen)).toBe(89);
  });

  it('counts up the steps of a bay — the order a child works through', () => {
    expect(cellOrdinal({ segment: 0, step: 1, cell: 1 })).toBe(1);
    expect(cellOrdinal({ segment: 0, step: 2, cell: 0 })).toBe(
      FULL_ARENA_LAYOUT.rows[0]?.[1],
    );
    expect(cellOrdinal({ segment: 1, step: 1, cell: 0 })).toBe(30);
  });
});

describe('cellFromKey', () => {
  it('undoes cellKey', () => {
    const cell = { segment: 2, step: 3, cell: 4 };
    expect(cellOrdinal(cell)).not.toBeNull();

    expect(cellFromKey(cellKey(cell))).toEqual(cell);
  });

  it('refuses what is not a cell — a route parameter is just a string', () => {
    expect(cellFromKey('')).toBeNull();
    expect(cellFromKey('1-2')).toBeNull();
    expect(cellFromKey('a-b-c')).toBeNull();
    expect(cellFromKey('0-0--1')).toBeNull();
  });

  it('refuses a cell the arena does not have', () => {
    expect(cellFromKey('0-9-0')).toBeNull();
    // The platform ring carries no cells.
    expect(cellFromKey('0-0-0')).toBeNull();
    expect(cellFromKey('0-1-99')).toBeNull();
  });

  it('follows the layout it is given', () => {
    // Twelve lessons: four to a bay, one on each step.
    const layout = arenaLayout(12);
    expect(cellFromKey('0-1-0', layout)).toEqual({
      segment: 0,
      step: 1,
      cell: 0,
    });
    expect(cellOrdinal({ segment: 0, step: 1, cell: 0 }, layout)).toBe(0);
  });
});
