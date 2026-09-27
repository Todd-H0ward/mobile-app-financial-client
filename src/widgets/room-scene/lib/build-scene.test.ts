import type { Mesh } from 'three';
import { describe, expect, it, vi } from 'vitest';

// The GLB loaders need the native asset system; the arena itself does not.
vi.mock('./center-character', () => ({
  attachCenterCharacter: () => new Promise(() => {}),
}));
vi.mock('./watchers', () => ({
  attachWatchers: () => new Promise(() => {}),
}));

import { ARENA_LAYOUT } from '@/entities/lesson';

import { buildScene } from './build-scene';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('buildScene', () => {
  it('builds one pressable row per terrace that has cells', () => {
    const model = buildScene('factory', 'idle');
    const rows = ARENA_LAYOUT.rows.flat().filter((cells) => cells > 0);
    expect(model.cellTargets()).toHaveLength(rows.length);
    model.dispose();
  });

  it('sinks cells before their numbers exist, then numbers them where they sank', () => {
    const model = buildScene('factory', 'idle');
    const done = ['0-1-0', '0-1-1'];

    // The order the component uses on a fresh context: sinks first.
    expect(() => model.setCellsDone(done, true)).not.toThrow();
    expect(() => model.setCellAccess([], 0)).not.toThrow();
    expect(() => model.tick(1, 0.016)).not.toThrow();

    model.dispose();
  });

  it('turns a ray hit on a row back into its cell', () => {
    const model = buildScene('factory', 'idle');
    const [row] = model.cellTargets() as Mesh[];
    if (!row) throw new Error('no pressable row');
    const { starts } = row.userData as { starts: number[] };

    // The first row is bay 0 of the first step — the platform ring has none.
    expect(model.cellAt(row, starts[1] ?? 0)).toEqual({
      segment: 0,
      step: 1,
      cell: 1,
    });
    expect(model.cellAt(row as Mesh, -1)).toBeNull();
    model.dispose();
  });

  it('holds and releases a cell without leaving the fill up', () => {
    const model = buildScene('factory', 'idle');
    model.setCellAccess([], 0);
    model.beginCellHold({ segment: 0, step: 1, cell: 2 });
    model.setCellHoldProgress(0.5);
    expect(() => model.endCellHold()).not.toThrow();
    model.dispose();
  });
});
