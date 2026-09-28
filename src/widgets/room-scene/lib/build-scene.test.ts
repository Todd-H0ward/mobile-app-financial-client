import type { Mesh } from 'three';
import { describe, expect, it, vi } from 'vitest';

// The GLB loaders need the native asset system; the arena itself does not.
vi.mock('./center-character', () => ({
  attachCenterCharacter: () => new Promise(() => {}),
}));
vi.mock('./watchers', () => ({
  attachWatchers: () => new Promise(() => {}),
}));
vi.mock('./local-asset', () => ({
  loadGlTexture: () => new Promise(() => {}),
  localFileOf: () => new Promise(() => {}),
  readAssetBytes: () => new Promise(() => {}),
}));
vi.mock('./arena-textures', () => ({
  ARENA_TEXTURES: { concrete: 1, rust: 2 },
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

  it('lights passed cells before their numbers exist, then numbers them', () => {
    const model = buildScene('factory', 'idle');
    const done = ['0-1-0', '0-1-1'];

    // The order the component uses on a fresh context: done cells first.
    expect(() => model.setCellsDone(done)).not.toThrow();
    expect(() => model.setCellAccess([], 0)).not.toThrow();
    expect(() => model.tick(1, 0.016)).not.toThrow();

    model.dispose();
  });

  it('keeps every cell where it was built when its lesson is passed', () => {
    const model = buildScene('factory', 'idle');
    const [row] = model.cellTargets() as Mesh[];
    if (!row) throw new Error('no pressable row');
    const position = row.geometry.getAttribute('position');
    const before = Array.from(position.array as Float32Array);

    model.setCellsDone(['0-1-0']);
    model.setCellAccess([], 0);
    model.tick(1, 1);

    expect(Array.from(position.array as Float32Array)).toEqual(before);
    model.dispose();
  });

  it('pins a passed cell to the disc when the bay rises out of the flatten', () => {
    const model = buildScene('factory', 'idle');
    const [row] = model.cellTargets() as Mesh[];
    if (!row) throw new Error('no pressable row');
    const position = row.geometry.getAttribute('position');

    model.setLevelProgress(0);
    const pristine = Array.from(position.array as Float32Array);

    model.setCellsDone(['0-1-0']);
    const pinned = Array.from(position.array as Float32Array);
    expect(pinned).not.toEqual(pristine);

    // Only sinks — a passed tile never rides the wall up.
    for (let i = 1; i < pinned.length; i += 3) {
      expect(pinned[i]).toBeLessThanOrEqual(pristine[i] as number);
    }

    model.setCellsDone([]);
    expect(Array.from(position.array as Float32Array)).toEqual(pristine);
    model.dispose();
  });

  it('keeps a passed cell on the disc when leaving the map for a bay', () => {
    const model = buildScene('factory', 'idle');
    const [row] = model.cellTargets() as Mesh[];
    if (!row) throw new Error('no pressable row');
    const position = row.geometry.getAttribute('position');

    model.setLevelProgress(1);
    model.setCellsDone(['0-1-0']);
    const onDisk = Array.from(position.array as Float32Array);

    model.setLevelProgress(0);
    const opened = Array.from(position.array as Float32Array);
    expect(opened).not.toEqual(onDisk);

    for (let i = 1; i < opened.length; i += 3) {
      expect(opened[i]).toBeLessThanOrEqual(onDisk[i] as number);
    }

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
