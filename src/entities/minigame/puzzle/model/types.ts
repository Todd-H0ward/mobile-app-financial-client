import type { PieceTabs } from '../lib/piece-path';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Stepped grid sizes for a sitting — phone-friendly, not five web tiers of 100+. */
type PuzzleDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

/** Stars earned for a finished level, 0…3. */
type PuzzleScore = 0 | 1 | 2 | 3;

/** Grid size for one difficulty. */
interface BoardSize {
  /** Total pieces on the board. */
  count: number;
  /** Columns in the grid; rows = ceil(count / cols). */
  cols: number;
}

/** Catalogue row for one puzzle image. */
interface PuzzleLevel {
  /** Stable id — also the seed for tabs and tray order. */
  id: string;
  /** Which difficulty grid this level uses. */
  difficulty: PuzzleDifficulty;
  /** Pack grouping for unlock ladders. */
  pack: string;
  /**
   * Key into the widget image map. Entity stays free of `require()` so node
   * tests can import the catalogue without RN assets.
   */
  imageKey: string;
}

/** Where a piece sits during a sitting. */
type Placement =
  | { kind: 'tray' }
  | { kind: 'loose'; x: number; y: number }
  | { kind: 'placed' };

/** One piece on the board, derived from seed + placements. */
interface BoardPiece {
  id: number;
  tabs: PieceTabs;
  targetRow: number;
  targetCol: number;
  placement: Placement;
}

/** Piece rectangle in screen coordinates (ghost / measure). */
interface PieceBody {
  left: number;
  top: number;
  size: number;
}

/** Drag ghost — same body, tagged with the piece id. */
interface DragGhost extends PieceBody {
  id: number;
}

/** Axis-aligned rect in window coordinates. */
interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Outcome of aiming / releasing a piece. */
type DropTarget = 'slot' | 'board' | 'tray';

export type {
  BoardPiece,
  BoardSize,
  DragGhost,
  DropTarget,
  PieceBody,
  Placement,
  PuzzleDifficulty,
  PuzzleLevel,
  PuzzleScore,
  ScreenRect,
};
