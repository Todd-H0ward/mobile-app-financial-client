/**
 * Geometry of jigsaw pieces. Each side is flat (0), a tab out (1), or a
 * blank in (−1); a neighbour's tab and this piece's blank on the shared
 * edge always flip sign so the pieces lock.
 *
 * Board layout and tray order are pure functions of indices and a seed: the
 * same seed always yields the same result, independent of call order — a
 * deterministic hash over coordinates, not a sequential PRNG stream.
 */

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TTab = -1 | 0 | 1;

interface PieceTabs {
  top: TTab;
  right: TTab;
  bottom: TTab;
  left: TTab;
}

/** Which sides to stroke in the seam outline — see {@link pieceSeamPath}. */
interface PieceSides {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * How much larger the SVG box is than the piece body: tabs need 32% on each
 * side (viewBox `-32 -32 164 164` and `fitCell` on the piece use the same
 * numbers). Callers that size a piece in pixels — drag, for example — need
 * this ratio.
 */
export const PIECE_BOX_RATIO = 1.64;

/** Share of the cell that tabs overhang on each side (`(ratio − 1) / 2`). */
export const PIECE_TAB_OVERHANG = 0.32;

// ═══════════════════════════════════════════
// HASHING / SEEDING
// ═══════════════════════════════════════════

/** Simple string hash (djb2) — numeric ids pass through truncated. */
export const hashSeed = (id: number | string): number => {
  if (typeof id === 'number') return Math.trunc(id) >>> 0;

  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = (h * 33) ^ id.charCodeAt(i);
  }
  return h >>> 0;
};

/** FNV-1a-like mix of several integers into one 32-bit number. */
const hash = (...values: number[]): number => {
  let h = 2166136261;
  for (const v of values) {
    h ^= v;
    h = Math.imul(h, 16777619);
    h ^= h >>> 15;
  }
  return h >>> 0;
};

// ═══════════════════════════════════════════
// PATHS
// ═══════════════════════════════════════════

const edge = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tab: TTab,
): string => {
  if (!tab) return `L ${x2} ${y2} `;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = dy / len;
  const ny = -dx / len;

  const point = (along: number, out: number) => {
    const signedOut = out * tab;
    const px = x1 + ux * len * along + nx * len * signedOut;
    const py = y1 + uy * len * along + ny * len * signedOut;
    return `${px.toFixed(2)} ${py.toFixed(2)}`;
  };

  return (
    `L ${point(0.4, 0)} C ${point(0.36, 0.1)} ${point(0.27, 0.19)} ${point(0.5, 0.19)} ` +
    `C ${point(0.73, 0.19)} ${point(0.64, 0.1)} ${point(0.6, 0)} L ${point(1, 0)} `
  );
};

export const piecePath = (tabs: PieceTabs, size = 100): string => {
  return (
    'M 0 0 ' +
    edge(0, 0, size, 0, tabs.top) +
    edge(size, 0, size, size, tabs.right) +
    edge(size, size, 0, size, tabs.bottom) +
    edge(0, size, 0, 0, tabs.left) +
    'Z'
  );
};

/**
 * Open path of only the chosen sides. The board needs this: neighbours share
 * an edge, and if each piece stroked its whole outline the shared seam would
 * get two dashed strokes out of phase. So each seam is drawn by exactly one
 * piece (its right/bottom), and the outer frame is closed by the first row
 * and first column.
 *
 * Each side is its own subpath (`M …`) so the dash starts at the corner and
 * every side looks the same.
 */
export const pieceSeamPath = (
  tabs: PieceTabs,
  sides: PieceSides,
  size = 100,
): string => {
  const parts: string[] = [];

  if (sides.top) parts.push(`M 0 0 ${edge(0, 0, size, 0, tabs.top)}`);
  if (sides.right)
    parts.push(`M ${size} 0 ${edge(size, 0, size, size, tabs.right)}`);
  if (sides.bottom)
    parts.push(`M ${size} ${size} ${edge(size, size, 0, size, tabs.bottom)}`);
  if (sides.left) parts.push(`M 0 ${size} ${edge(0, size, 0, 0, tabs.left)}`);

  return parts.join('');
};

// ═══════════════════════════════════════════
// BOARD / TRAY
// ═══════════════════════════════════════════

/** Tab or blank — even split: `% 3` biased toward tabs 2:1. */
const sign = (seed: number, a: number, b: number): TTab => {
  return hash(seed, a, b) % 2 === 0 ? -1 : 1;
};

/**
 * Deterministic layout of `count` cells in a `cols`-wide grid: neighbouring
 * cells get opposite tabs on the shared edge so they lock visually. `seed`
 * changes the joint pattern between puzzles of the same size.
 */
export const generateBoard = (
  count: number,
  cols: number,
  seed = 0,
): PieceTabs[] => {
  const rows = Math.ceil(count / cols);
  const horizontal = (row: number, col: number) => sign(seed, row + 1, col + 2);
  const vertical = (row: number, col: number) => sign(seed, col + 3, row + 1);

  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;

    return {
      top: row === 0 ? 0 : (-horizontal(row - 1, col) as TTab),
      bottom: row === rows - 1 ? 0 : horizontal(row, col),
      left: col === 0 ? 0 : (-vertical(row, col - 1) as TTab),
      right: col === cols - 1 ? 0 : vertical(row, col),
    };
  });
};

/** Deterministic set of free pieces (for the tray / showcase). */
export const generateLoosePieces = (count: number, seed = 0): PieceTabs[] => {
  const looseSign = (a: number): TTab => sign(seed, a, 97);

  return Array.from({ length: count }, (_, i) => ({
    top: looseSign(i + 1),
    right: -looseSign(i + 2) as TTab,
    bottom: looseSign(i + 4),
    left: -looseSign(i + 5) as TTab,
  }));
};

/**
 * Pseudo-random stream from one seed (mulberry32).
 *
 * A stream, not a hash of the step index: neighbouring values are uncorrelated,
 * whereas hashing `(seed, i)` dragged `i` along and the shuffle below came out
 * almost sorted.
 *
 * Divide by 2^32, not 2^32−1: otherwise exactly 1 is reachable and `Math.floor`
 * in the shuffle would index past the end of the array.
 */
const randomStream = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Deterministic shuffled order of indices `[0, count)` — for the piece tray.
 * The seed decides everything: the same level with the same shuffle count
 * lays out the same way, and a saved assembly comes back as left.
 *
 * Fisher–Yates over a stream: earlier each step hashed `(seed, i)`, and `j`
 * too often landed on `i` — pieces stayed put and the tray nearly followed
 * board order.
 */
export const shuffleIndices = (count: number, seed: number): number[] => {
  const indices = Array.from({ length: count }, (_, i) => i);
  const next = randomStream(seed);

  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const left = indices[i];
    const right = indices[j];
    if (left === undefined || right === undefined) continue;
    indices[i] = right;
    indices[j] = left;
  }

  return indices;
};

export type { PieceSides, PieceTabs, TTab };
