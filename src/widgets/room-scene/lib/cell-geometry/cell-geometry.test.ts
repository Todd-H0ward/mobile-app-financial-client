import { BufferGeometry, Float32BufferAttribute } from 'three';
import { describe, expect, it } from 'vitest';

import {
  cellArcOf,
  FULL_ARENA_LAYOUT,
  rowCells,
  SCENE_TILE_RINGS,
} from '@/entities/scene';

import { arcSolid, cellArc, fullArc, mergeParts } from './cell-geometry';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const ring = SCENE_TILE_RINGS[0];

/** Headings of every vertex, in degrees, the way the scene measures them. */
const headingsOf = (geometry: BufferGeometry): number[] => {
  const position = geometry.getAttribute('position');
  const headings: number[] = [];
  for (let i = 0; i < position.count; i += 1) {
    headings.push(
      (Math.atan2(position.getX(i), position.getZ(i)) * 180) / Math.PI,
    );
  }
  return headings;
};

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('cellArc', () => {
  it('lays the layout arc on its ring', () => {
    const [cell] = rowCells(FULL_ARENA_LAYOUT, 0, 1);
    const ring = SCENE_TILE_RINGS[1];
    if (!cell || !ring) throw new Error('no first step');
    expect(cellArc(FULL_ARENA_LAYOUT, cell, ring)).toEqual({
      ...cellArcOf(FULL_ARENA_LAYOUT, cell),
      ring,
    });
  });

  it('has nothing for a cell the layout lacks', () => {
    expect(
      cellArc(FULL_ARENA_LAYOUT, { segment: 0, step: 0, cell: 0 }, ring),
    ).toBeNull();
  });
});

describe('fullArc', () => {
  it('goes all the way round', () => {
    const arc = fullArc(ring);
    expect(arc.to - arc.from).toBe(360);
  });
});

describe('arcSolid', () => {
  it('stays inside its arc, its radii and its heights', () => {
    const arc = { from: 10, to: 60, ring };
    const solid = arcSolid(arc);
    const position = solid.getAttribute('position');

    for (const heading of headingsOf(solid)) {
      expect(heading).toBeGreaterThanOrEqual(arc.from - 1e-4);
      expect(heading).toBeLessThanOrEqual(arc.to + 1e-4);
    }
    for (let i = 0; i < position.count; i += 1) {
      const radius = Math.hypot(position.getX(i), position.getZ(i));
      expect(radius).toBeGreaterThanOrEqual(ring.inner - 1e-3);
      expect(radius).toBeLessThanOrEqual(ring.outer + 1e-3);
      expect(position.getY(i)).toBeGreaterThanOrEqual(ring.bottom);
      expect(position.getY(i)).toBeLessThanOrEqual(ring.top);
    }
  });

  it('cuts a wider arc into more facets', () => {
    const narrow = arcSolid({ from: 0, to: 17, ring });
    const wide = arcSolid({ from: 0, to: 51, ring });
    expect(wide.getAttribute('position').count).toBeGreaterThan(
      narrow.getAttribute('position').count,
    );
  });

  it('carries UVs for every vertex so albedo can tile', () => {
    const solid = arcSolid({ from: 10, to: 40, ring });
    const position = solid.getAttribute('position');
    const uv = solid.getAttribute('uv');
    expect(uv).toBeTruthy();
    expect(uv?.count).toBe(position.count);
  });
});

describe('mergeParts', () => {
  it('keeps each part as one run, with its colour and first triangle', () => {
    const a = arcSolid({ from: 0, to: 17, ring });
    const b = arcSolid({ from: 17, to: 34, ring });
    const merged = mergeParts(
      [a, b],
      [
        [1, 0, 0],
        [0, 0, 1],
      ],
    );

    const aLength = a.getAttribute('position').array.length;
    expect(merged.ranges[0]).toEqual({ from: 0, to: aLength });
    expect(merged.ranges[1]?.from).toBe(aLength);
    expect(merged.starts).toEqual([0, aLength / 9]);

    const color = merged.geometry.getAttribute('color');
    expect(color.getX(0)).toBe(1);
    expect(color.getZ(color.count - 1)).toBe(1);
    expect(color.getX(color.count - 1)).toBe(0);
  });

  it('expands indexed parts so every run is contiguous', () => {
    const indexed = new BufferGeometry();
    indexed.setAttribute(
      'position',
      new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1], 3),
    );
    indexed.setIndex([0, 1, 2, 1, 3, 2]);
    const merged = mergeParts([indexed]);
    expect(merged.geometry.getAttribute('position').count).toBe(6);
    expect(merged.geometry.index).toBeNull();
  });
});
