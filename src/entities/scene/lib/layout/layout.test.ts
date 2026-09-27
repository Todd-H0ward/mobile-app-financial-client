import { describe, expect, it } from 'vitest';

import {
  SCENE_GEAR_ANGLES,
  SCENE_SLOT_ARC,
  SCENE_TILE_RINGS,
} from '../../model';

import {
  arenaLayout,
  cellArcOf,
  FULL_ARENA_LAYOUT,
  layoutCell,
  layoutOrdinal,
  rowCells,
  SCENE_FIRST_CELL_STEP,
  SCENE_MAX_CELLS,
} from './layout';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Every arc of one row, in ordinal order. */
const arcsOf = (
  layout: ReturnType<typeof arenaLayout>,
  segment: number,
  step: number,
) => rowCells(layout, segment, step).map((cell) => cellArcOf(layout, cell));

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('arenaLayout', () => {
  it('leaves the platform ring bare — the lessons start on the first step', () => {
    expect(SCENE_FIRST_CELL_STEP).toBe(1);
    for (const bay of FULL_ARENA_LAYOUT.rows) expect(bay[0]).toBe(0);
  });

  it('gives each bay thirty of ninety, more on the longer steps', () => {
    expect(FULL_ARENA_LAYOUT.count).toBe(SCENE_MAX_CELLS);
    for (const bay of FULL_ARENA_LAYOUT.rows) {
      expect(bay).toEqual([0, 5, 7, 8, 10]);
    }
  });

  it('shares an uneven count out bay by bay', () => {
    const { rows } = arenaLayout(80);
    expect(
      rows.map((bay) => bay.reduce((sum, cells) => sum + cells, 0)),
    ).toEqual([27, 27, 26]);
  });

  it('runs a bay gear to gear on a ring with no gear in it — no bald patch', () => {
    const step = 1;
    expect(SCENE_TILE_RINGS[step]?.slotted).toBe(false);
    const arcs = arcsOf(FULL_ARENA_LAYOUT, 0, step);
    const gear = SCENE_GEAR_ANGLES[0] ?? 0;
    expect(arcs[arcs.length - 1]?.from).toBeCloseTo(gear, 6);
    expect(arcs[0]?.to).toBeCloseTo(gear + 120, 6);
  });

  it('keeps the slot only where a gear stands', () => {
    const step = SCENE_TILE_RINGS.findIndex((ring) => ring.slotted);
    expect(step).toBeGreaterThan(SCENE_FIRST_CELL_STEP);
    const arcs = arcsOf(FULL_ARENA_LAYOUT, 0, step);
    const covered = arcs.reduce(
      (sum, arc) => sum + (arc ? arc.to - arc.from : 0),
      0,
    );
    expect(covered).toBeCloseTo(120 - SCENE_SLOT_ARC, 6);
  });

  it('numbers a row left to right as seen from the bay — against the heading', () => {
    const arcs = arcsOf(FULL_ARENA_LAYOUT, 1, 2);
    for (let index = 1; index < arcs.length; index += 1) {
      expect(arcs[index]?.to).toBeCloseTo(arcs[index - 1]?.from ?? 0, 6);
    }
  });

  it('never leaves a lower step bare while one above has spare cells', () => {
    for (const count of [3, 6, 9, 12, 40]) {
      for (const bay of arenaLayout(count).rows) {
        const steps = bay.slice(SCENE_FIRST_CELL_STEP);
        const firstEmpty = steps.indexOf(0);
        if (firstEmpty < 0) continue;
        for (const cells of steps.slice(firstEmpty)) {
          expect(cells).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('caps at the arena and never goes negative', () => {
    expect(arenaLayout(500).count).toBe(90);
    expect(arenaLayout(-3).count).toBe(0);
    expect(arenaLayout(Number.NaN).count).toBe(0);
  });
});

describe('layoutOrdinal / layoutCell', () => {
  it('numbers up the steps of a bay, then on to the next bay', () => {
    expect(
      layoutOrdinal(FULL_ARENA_LAYOUT, { segment: 0, step: 1, cell: 0 }),
    ).toBe(0);
    expect(
      layoutOrdinal(FULL_ARENA_LAYOUT, { segment: 0, step: 2, cell: 0 }),
    ).toBe(5);
    expect(
      layoutOrdinal(FULL_ARENA_LAYOUT, { segment: 1, step: 1, cell: 0 }),
    ).toBe(30);
    expect(
      layoutOrdinal(FULL_ARENA_LAYOUT, { segment: 2, step: 4, cell: 9 }),
    ).toBe(89);
  });

  it('round-trips every ordinal', () => {
    for (const count of [90, 80, 41, 7]) {
      const layout = arenaLayout(count);
      for (let ordinal = 0; ordinal < count; ordinal += 1) {
        const cell = layoutCell(layout, ordinal);
        expect(cell).not.toBeNull();
        if (cell) expect(layoutOrdinal(layout, cell)).toBe(ordinal);
      }
      expect(layoutCell(layout, count)).toBeNull();
      expect(layoutCell(layout, -1)).toBeNull();
    }
  });

  it('has no cells on the platform', () => {
    expect(
      layoutOrdinal(FULL_ARENA_LAYOUT, { segment: 0, step: 0, cell: 0 }),
    ).toBeNull();
  });
});
