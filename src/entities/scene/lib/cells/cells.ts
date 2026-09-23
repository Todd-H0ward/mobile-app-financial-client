import { SCENE_CELLS_PER_STEP, type SceneCell } from '../../model';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Which cell a triangle belongs to.
 *
 * The six cells of a terrace are drawn as one buffer, because ninety separate
 * meshes would be ninety draw calls for a floor nobody is looking at. The
 * price of merging is that a ray comes back with a triangle index and no idea
 * whose it is — `starts` is what buys the identity back. Each entry is the
 * first triangle of a cell, so the answer is the last one that is not past
 * the hit.
 *
 * Returns `null` for a triangle before the first cell or past the last, which
 * is what a ray that hit something else entirely looks like.
 */
const cellOfFace = (starts: number[], faceIndex: number): number | null => {
  if (faceIndex < 0 || starts.length === 0) return null;
  if (faceIndex < starts[0]) return null;

  let found = -1;
  for (let index = 0; index < starts.length; index += 1) {
    if (starts[index] > faceIndex) break;
    found = index;
  }

  return found < 0 ? null : found;
};

/**
 * Where a cell sits along its arc, `0 … 1`.
 *
 * Six cells, so the first is at 0 and the last at 1 — the ends included, the
 * way a row of buttons is laid out rather than the way a pie is cut.
 */
const cellFraction = (cell: number): number =>
  SCENE_CELLS_PER_STEP <= 1 ? 0 : cell / (SCENE_CELLS_PER_STEP - 1);

/**
 * One cell as a string, for the maps that key on it.
 *
 * Three small numbers and no ambiguity between them: `1-2-3` is room 1,
 * terrace 2, cell 3, and nothing else.
 */
const cellKey = (cell: SceneCell): string =>
  `${cell.segment}-${cell.step}-${cell.cell}`;

/** Whether two cells are the same tile. */
const isSameCell = (a: SceneCell | null, b: SceneCell | null): boolean =>
  a !== null && b !== null && cellKey(a) === cellKey(b);

export { cellFraction, cellKey, cellOfFace, isSameCell };
