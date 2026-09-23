import { describe, expect, it } from 'vitest';

import { SCENE_CELLS_PER_STEP } from '../../model';

import { cellFraction, cellOfFace } from './cells';

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
