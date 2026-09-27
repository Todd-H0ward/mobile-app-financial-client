import { SCENE_CELLS_PER_STEP, type SceneCell } from '../../model';
import {
  type ArenaLayout,
  FULL_ARENA_LAYOUT,
  hasCell,
  layoutOrdinal,
} from '../layout';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Which cell a triangle belongs to. */
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

/** Where a cell sits along its arc, `0 … 1`. */
const cellFraction = (cell: number): number =>
  SCENE_CELLS_PER_STEP <= 1 ? 0 : cell / (SCENE_CELLS_PER_STEP - 1);

/** One cell as a string, for the maps that key on it. */
const cellKey = (cell: SceneCell): string =>
  `${cell.segment}-${cell.step}-${cell.cell}`;

const isSameCell = (a: SceneCell | null, b: SceneCell | null): boolean =>
  a !== null && b !== null && cellKey(a) === cellKey(b);

/** A cell's place in the whole arena, `0 … layout.count - 1`. */
const cellOrdinal = (
  cell: SceneCell,
  layout: ArenaLayout = FULL_ARENA_LAYOUT,
): number | null => layoutOrdinal(layout, cell);

/** The cell a key names, or `null` if the string is not one of the layout's. */
const cellFromKey = (
  key: string,
  layout: ArenaLayout = FULL_ARENA_LAYOUT,
): SceneCell | null => {
  const parts = key.split('-');
  if (parts.length !== 3) return null;
  if (!parts.every((part) => /^\d+$/.test(part))) return null;

  const [segment, step, cell] = parts.map(Number);
  const found = { segment, step, cell };
  return hasCell(layout, found) ? found : null;
};

export {
  cellFraction,
  cellFromKey,
  cellKey,
  cellOfFace,
  cellOrdinal,
  isSameCell,
};
