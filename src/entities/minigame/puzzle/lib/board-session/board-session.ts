import { clamp } from '@/shared/utils';

import type {
  BoardPiece,
  DragGhost,
  DropTarget,
  Placement,
  ScreenRect,
} from '../../model/types';
import { generateBoard, shuffleIndices } from '../piece-path';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Piece snaps when its centre is within this share of the slot width. */
export const SNAP_THRESHOLD_RATIO = 0.5;

export const IN_TRAY: Placement = { kind: 'tray' };

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const restorePlacements = (
  placements: Record<number, Placement> | undefined,
  count: number,
): Record<number, Placement> => {
  if (!placements) return {};

  return Object.fromEntries(
    Object.entries(placements).filter(([id]) => {
      const index = Number(id);
      return Number.isInteger(index) && index >= 0 && index < count;
    }),
  );
};

export const buildPieces = (
  count: number,
  cols: number,
  seed: number,
  placements: Record<number, Placement>,
): BoardPiece[] => {
  const boardTabs = generateBoard(count, cols, seed);

  return boardTabs.map((tabs, i) => ({
    id: i,
    tabs,
    targetRow: Math.floor(i / cols),
    targetCol: i % cols,
    placement: placements[i] ?? IN_TRAY,
  }));
};

/** Tray order for a shuffle nonce — same seed + nonce → same order. */
export const trayOrderOf = (
  count: number,
  seed: number,
  shuffleNonce: number,
): number[] => shuffleIndices(count, seed + shuffleNonce);

export const trayPiecesOf = (
  pieces: readonly BoardPiece[],
  trayOrder: readonly number[],
): BoardPiece[] =>
  trayOrder
    .map((id) => pieces[id])
    .filter(
      (piece): piece is BoardPiece =>
        piece !== undefined && piece.placement.kind === 'tray',
    );

export const placedCountOf = (pieces: readonly BoardPiece[]): number =>
  pieces.filter((piece) => piece.placement.kind === 'placed').length;

export const isBoardComplete = (
  placedCount: number,
  totalCount: number,
): boolean => placedCount === totalCount && totalCount > 0;

/**
 * Visible board rect: viewport clips the board under zoom. Without a viewport
 * the full board counts.
 */
export const visibleBoardRect = (
  board: ScreenRect,
  viewport?: ScreenRect | null,
): ScreenRect => {
  if (!viewport) return board;

  return {
    left: Math.max(board.left, viewport.left),
    top: Math.max(board.top, viewport.top),
    right: Math.min(board.right, viewport.right),
    bottom: Math.min(board.bottom, viewport.bottom),
  };
};

/**
 * Target cell for piece `id`, derived from the board rect — not from measuring
 * each slot view. Per-slot `measureInWindow` was unreliable (collapsed % height
 * / shared parent box), so a drop near the board centre snapped *any* piece
 * and it teleported into its real cell — looked like a random lock.
 */
export const slotRectOf = (
  board: ScreenRect,
  cols: number,
  rows: number,
  id: number,
): ScreenRect => {
  const col = id % cols;
  const row = Math.floor(id / cols);
  const cellW = (board.right - board.left) / cols;
  const cellH = (board.bottom - board.top) / rows;

  return {
    left: board.left + col * cellW,
    top: board.top + row * cellH,
    right: board.left + (col + 1) * cellW,
    bottom: board.top + (row + 1) * cellH,
  };
};

const inside = (rect: ScreenRect, x: number, y: number): boolean =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

/**
 * Shared aim / drop outcome. Highlight and release must agree — otherwise the
 * glow would promise a snap the drop does not honour.
 */
export const dropTargetOf = ({
  board,
  viewport,
  slot,
  ghost,
  snapRatio = SNAP_THRESHOLD_RATIO,
}: {
  board: ScreenRect;
  viewport?: ScreenRect | null;
  /** Target slot for this piece id, or null if unmeasured. */
  slot: ScreenRect | null;
  ghost: DragGhost;
  snapRatio?: number;
}): DropTarget => {
  const boardVisible = visibleBoardRect(board, viewport);
  const centerX = ghost.left + ghost.size / 2;
  const centerY = ghost.top + ghost.size / 2;

  const panel = viewport ?? board;
  if (!inside(panel, centerX, centerY)) return 'tray';
  if (!inside(boardVisible, centerX, centerY)) return 'board';
  if (!slot) return 'board';

  const distance = Math.hypot(
    centerX - (slot.left + (slot.right - slot.left) / 2),
    centerY - (slot.top + (slot.bottom - slot.top) / 2),
  );
  const slotWidth = slot.right - slot.left;

  return distance <= slotWidth * snapRatio ? 'slot' : 'board';
};

/**
 * Loose placement as board-relative fractions, clamped to the table (viewport
 * union board) so a miss still lands on the canvas, not off-screen.
 */
export const loosePlacementOf = ({
  ghost,
  board,
  viewport,
  cols,
  rows,
}: {
  ghost: DragGhost;
  board: ScreenRect;
  viewport?: ScreenRect | null;
  cols: number;
  rows: number;
}): Extract<Placement, { kind: 'loose' }> => {
  const boardWidth = board.right - board.left;
  const boardHeight = board.bottom - board.top;

  const limit = (
    value: number,
    size: number,
    panelStart: number | undefined,
    panelSize: number | undefined,
    step: number,
  ) => {
    const start = panelStart === undefined ? 0 : panelStart / size;
    const end =
      panelStart === undefined || panelSize === undefined
        ? 1
        : (panelStart + panelSize) / size;

    return clamp(value, Math.min(0, start), Math.max(1, end) - step);
  };

  const panelLeft =
    viewport === null || viewport === undefined
      ? undefined
      : viewport.left - board.left;
  const panelTop =
    viewport === null || viewport === undefined
      ? undefined
      : viewport.top - board.top;
  const panelWidth =
    viewport === null || viewport === undefined
      ? undefined
      : viewport.right - viewport.left;
  const panelHeight =
    viewport === null || viewport === undefined
      ? undefined
      : viewport.bottom - viewport.top;

  return {
    kind: 'loose',
    x: limit(
      (ghost.left - board.left) / boardWidth,
      boardWidth,
      panelLeft,
      panelWidth,
      1 / cols,
    ),
    y: limit(
      (ghost.top - board.top) / boardHeight,
      boardHeight,
      panelTop,
      panelHeight,
      1 / rows,
    ),
  };
};

export const applyDrop = ({
  placements,
  id,
  target,
  loose,
}: {
  placements: Record<number, Placement>;
  id: number;
  target: DropTarget;
  loose?: Extract<Placement, { kind: 'loose' }>;
}): Record<number, Placement> => {
  if (target === 'tray') {
    return { ...placements, [id]: IN_TRAY };
  }

  if (target === 'slot') {
    return { ...placements, [id]: { kind: 'placed' } };
  }

  return {
    ...placements,
    [id]: loose ?? { kind: 'loose', x: 0, y: 0 },
  };
};

const isPlacedId = (
  placements: Record<number, Placement>,
  id: number,
): boolean => placements[id]?.kind === 'placed';

/**
 * Hint: place the first unplaced piece in tray order.
 * Returns null when nothing is left to reveal.
 */
export const revealPiece = (
  placements: Record<number, Placement>,
  trayOrder: readonly number[],
): { placements: Record<number, Placement>; id: number } | null => {
  const next = trayOrder.find((id) => !isPlacedId(placements, id));
  if (next === undefined) return null;

  return {
    id: next,
    placements: { ...placements, [next]: { kind: 'placed' } },
  };
};

/** Hint: place every edge piece that is still free. */
export const revealEdges = (
  pieces: readonly BoardPiece[],
  rows: number,
  cols: number,
  placements: Record<number, Placement>,
): { placements: Record<number, Placement>; ids: number[] } | null => {
  const edgeIds = pieces
    .filter(
      (piece) =>
        piece.targetRow === 0 ||
        piece.targetCol === 0 ||
        piece.targetRow === rows - 1 ||
        piece.targetCol === cols - 1,
    )
    .map((piece) => piece.id)
    .filter((id) => placements[id]?.kind !== 'placed');

  if (edgeIds.length === 0) return null;

  return {
    ids: edgeIds,
    placements: {
      ...placements,
      ...Object.fromEntries(
        edgeIds.map((id) => [id, { kind: 'placed' as const }]),
      ),
    },
  };
};
