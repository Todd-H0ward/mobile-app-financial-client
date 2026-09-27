import {
  SCENE_GEAR_ANGLES,
  SCENE_SEGMENT_COUNT,
  SCENE_SLOT_ARC,
  SCENE_TERRACE_COUNT,
  SCENE_TILE_RINGS,
  type SceneCell,
  type SceneTileRing,
} from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** A cell's place on its ring, in degrees — `atan2(x, z)`, like the camera. */
interface CellArc {
  /** Heading of its first edge. */
  from: number;
  /** Heading of its last edge — always past `from`. */
  to: number;
}

interface ArenaLayout {
  /** Cells on each step of each bay, `rows[segment][step]`. Platform ring (`step 0`) holds none. */
  rows: readonly (readonly number[])[];
  /** Ordinal of the first cell of each row, `starts[segment][step]`. */
  starts: readonly (readonly number[])[];
  /** Where every cell lies, `arcs[segment][step][cell]`. */
  arcs: readonly (readonly (readonly CellArc[])[])[];
  /** Cells in the whole arena — the sum of `rows`. */
  count: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The first ring that carries cells. */
const SCENE_FIRST_CELL_STEP = 1;

/** Cells the arena holds before further lessons start stacking on them. */
const SCENE_MAX_CELLS = 90;

/** The last ring that carries cells — the rim. */
const SCENE_LAST_CELL_STEP = SCENE_TERRACE_COUNT - 1;

/** The shortest a cell may be along its arc, in world units. */
const SCENE_MIN_CELL_LENGTH = 44;

/** Degrees between two gears — the width of a bay. */
const BAY_ARC = 360 / SCENE_SEGMENT_COUNT;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** The stretch of a ring that belongs to one bay, in degrees. */
const bayArcOf = (segment: number, ring: SceneTileRing): CellArc => {
  const gear = SCENE_GEAR_ANGLES[segment] ?? 0;
  const margin = ring.slotted ? SCENE_SLOT_ARC / 2 : 0;
  return { from: gear + margin, to: gear + BAY_ARC - margin };
};

/** A row's length along the middle of its ring, in world units. */
const rowLength = (ring: SceneTileRing): number => {
  const { from, to } = bayArcOf(0, ring);
  return (((ring.inner + ring.outer) / 2) * (to - from) * Math.PI) / 180;
};

/** How many cells one row can take before its numbers stop fitting. */
const rowCapacity = (
  step: number,
  rings: readonly SceneTileRing[] = SCENE_TILE_RINGS,
): number => {
  const ring = rings[step];
  if (!ring || step < SCENE_FIRST_CELL_STEP || step > SCENE_LAST_CELL_STEP) {
    return 0;
  }
  return Math.max(1, Math.floor(rowLength(ring) / SCENE_MIN_CELL_LENGTH));
};

/** How one bay's lessons fill its steps, bottom first. */
const stepShares = (
  count: number,
  rings: readonly SceneTileRing[],
): number[] => {
  const weights = rings.map((ring) => {
    const { from, to } = bayArcOf(0, ring);
    return ((ring.inner + ring.outer) / 2) * (to - from);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0 || rings.length === 0) return rings.map(() => 0);

  const exact = weights.map((weight) => (weight / total) * count);
  const shares = exact.map(Math.floor);
  let left = count - shares.reduce((sum, share) => sum + share, 0);
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (const { index } of order) {
    if (left <= 0) break;
    shares[index] += 1;
    left -= 1;
  }

  for (let step = 0; step < shares.length; step += 1) {
    if (shares[step] > 0) continue;
    let donor = -1;
    for (let above = step + 1; above < shares.length; above += 1) {
      if (shares[above] > 1 && (donor < 0 || shares[above] > shares[donor])) {
        donor = above;
      }
    }
    if (donor < 0) break;
    shares[donor] -= 1;
    shares[step] = 1;
  }

  return shares;
};

/** The arcs of one row, in the order they are numbered. */
const rowArcs = (
  cells: number,
  segment: number,
  ring: SceneTileRing,
): CellArc[] => {
  if (cells <= 0) return [];
  const { from, to } = bayArcOf(segment, ring);
  const width = (to - from) / cells;
  return Array.from({ length: cells }, (_, index) => ({
    from: to - (index + 1) * width,
    to: to - index * width,
  }));
};

/** The arena cut into the rows it is given: `counts[segment][step]` cells. */
const arenaLayoutOf = (
  counts: readonly (readonly number[])[],
  rings: readonly SceneTileRing[] = SCENE_TILE_RINGS,
): ArenaLayout => {
  const rows: number[][] = [];
  const starts: number[][] = [];
  const arcs: CellArc[][][] = [];
  let ordinal = 0;

  for (let segment = 0; segment < SCENE_SEGMENT_COUNT; segment += 1) {
    const bay = Array.from({ length: SCENE_TERRACE_COUNT }, (_, step) => {
      if (step < SCENE_FIRST_CELL_STEP) return 0;
      const cells = counts[segment]?.[step] ?? 0;
      return Number.isInteger(cells) && cells > 0 ? cells : 0;
    });
    rows.push(bay);
    starts.push(
      bay.map((cells) => {
        const start = ordinal;
        ordinal += cells;
        return start;
      }),
    );
    arcs.push(
      bay.map((cells, step) => {
        const ring = rings[step];
        return ring ? rowArcs(cells, segment, ring) : [];
      }),
    );
  }

  return { rows, starts, arcs, count: ordinal };
};

/** The arena for `cellCount` cells when nothing says where they go. */
const arenaLayout = (
  cellCount: number,
  rings: readonly SceneTileRing[] = SCENE_TILE_RINGS,
): ArenaLayout => {
  const count = Math.max(
    0,
    Math.min(
      SCENE_MAX_CELLS,
      Math.floor(Number.isFinite(cellCount) ? cellCount : 0),
    ),
  );
  const steps = rings.slice(SCENE_FIRST_CELL_STEP, SCENE_TERRACE_COUNT);
  const share = Math.floor(count / SCENE_SEGMENT_COUNT);
  const extra = count % SCENE_SEGMENT_COUNT;

  const counts = Array.from({ length: SCENE_SEGMENT_COUNT }, (_, segment) => [
    ...Array.from({ length: SCENE_FIRST_CELL_STEP }, () => 0),
    ...stepShares(share + (segment < extra ? 1 : 0), steps),
  ]);
  return arenaLayoutOf(counts, rings);
};

/** Cells on one step of one bay; `0` for anything off the arena. */
const rowSize = (layout: ArenaLayout, segment: number, step: number): number =>
  layout.rows[segment]?.[step] ?? 0;

const hasCell = (layout: ArenaLayout, cell: SceneCell): boolean =>
  Number.isInteger(cell.segment) &&
  Number.isInteger(cell.step) &&
  Number.isInteger(cell.cell) &&
  cell.cell >= 0 &&
  cell.cell < rowSize(layout, cell.segment, cell.step);

/** The cell's place in the arena, or `null` if the layout has no such cell. */
const layoutOrdinal = (layout: ArenaLayout, cell: SceneCell): number | null =>
  hasCell(layout, cell)
    ? (layout.starts[cell.segment]?.[cell.step] ?? 0) + cell.cell
    : null;

/** The cell at an ordinal, or `null` past the end of the arena. */
const layoutCell = (layout: ArenaLayout, ordinal: number): SceneCell | null => {
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= layout.count) {
    return null;
  }

  for (let segment = 0; segment < layout.rows.length; segment += 1) {
    const bay = layout.rows[segment] ?? [];
    for (let step = 0; step < bay.length; step += 1) {
      const start = layout.starts[segment]?.[step] ?? 0;
      const cells = bay[step] ?? 0;
      if (ordinal >= start && ordinal < start + cells) {
        return { segment, step, cell: ordinal - start };
      }
    }
  }

  return null;
};

/** Where a cell lies on its ring, or `null` for a cell the layout lacks. */
const cellArcOf = (layout: ArenaLayout, cell: SceneCell): CellArc | null =>
  hasCell(layout, cell)
    ? (layout.arcs[cell.segment]?.[cell.step]?.[cell.cell] ?? null)
    : null;

/** Every cell of one row, in ordinal order. */
const rowCells = (
  layout: ArenaLayout,
  segment: number,
  step: number,
): SceneCell[] =>
  Array.from({ length: rowSize(layout, segment, step) }, (_, cell) => ({
    segment,
    step,
    cell,
  }));

/** The layout the arena was sized for: ninety lessons. */
const FULL_ARENA_LAYOUT = arenaLayout(SCENE_MAX_CELLS);

export type { ArenaLayout, CellArc };
export {
  arenaLayout,
  arenaLayoutOf,
  cellArcOf,
  FULL_ARENA_LAYOUT,
  hasCell,
  layoutCell,
  layoutOrdinal,
  rowCapacity,
  rowCells,
  rowSize,
  SCENE_FIRST_CELL_STEP,
  SCENE_LAST_CELL_STEP,
  SCENE_MAX_CELLS,
  SCENE_MIN_CELL_LENGTH,
};
