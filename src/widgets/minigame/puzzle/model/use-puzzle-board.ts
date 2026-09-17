import { useCallback, useMemo, useRef, useState } from 'react';

import {
  applyDrop,
  type BoardPiece,
  buildPieces,
  DIFFICULTY_BOARD,
  type DragGhost,
  dropTargetOf,
  hashSeed,
  isBoardComplete,
  loosePlacementOf,
  type PieceBody,
  type Placement,
  type PuzzleDifficulty,
  placedCountOf,
  restorePlacements,
  revealEdges,
  revealPiece,
  type ScreenRect,
  slotRectOf,
  trayOrderOf,
  trayPiecesOf,
} from '@/entities/minigame/puzzle';

import { type BoardLayout, usePieceDrag } from './use-piece-drag';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface UsePuzzleBoardOptions {
  puzzleId: string;
  difficulty: PuzzleDifficulty;
  onPiecePlaced?: () => void;
  initial?: {
    placements: Record<number, Placement>;
    trayShuffles: number;
  };
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Sitting state for one puzzle: placements, tray order, drag + snap target.
 * Pure transitions live in `@/entities/minigame/puzzle`; this hook owns refs
 * and React state.
 */
export const usePuzzleBoard = ({
  puzzleId,
  difficulty,
  onPiecePlaced,
  initial,
}: UsePuzzleBoardOptions) => {
  const { count, cols } = DIFFICULTY_BOARD[difficulty];
  const rows = Math.ceil(count / cols);
  const seed = hashSeed(puzzleId);

  const [shuffleNonce, setShuffleNonce] = useState(
    () => initial?.trayShuffles ?? 0,
  );
  const [placements, setPlacements] = useState<Record<number, Placement>>(() =>
    restorePlacements(initial?.placements, count),
  );
  const [snapTargetId, setSnapTargetId] = useState<number | null>(null);

  const layoutRef = useRef<BoardLayout | null>(null);
  const bodiesRef = useRef<Map<number, PieceBody>>(new Map());
  const overlayOriginRef = useRef({ x: 0, y: 0 });

  const trayOrder = useMemo(
    () => trayOrderOf(count, seed, shuffleNonce),
    [count, seed, shuffleNonce],
  );

  const pieces = useMemo(
    () => buildPieces(count, cols, seed, placements),
    [count, cols, seed, placements],
  );

  const trayPieces = useMemo(
    () => trayPiecesOf(pieces, trayOrder),
    [pieces, trayOrder],
  );

  const placedCount = placedCountOf(pieces);

  const slotFor = useCallback(
    (id: number): ScreenRect | null => {
      const layout = layoutRef.current;
      if (!layout) return null;
      return slotRectOf(layout.board, cols, rows, id);
    },
    [cols, rows],
  );

  const setLayout = useCallback((layout: BoardLayout | null) => {
    layoutRef.current = layout;
  }, []);

  const setOverlayOrigin = useCallback((x: number, y: number) => {
    overlayOriginRef.current = { x, y };
  }, []);

  const setPieceBody = useCallback((id: number, body: PieceBody | null) => {
    if (!body) {
      bodiesRef.current.delete(id);
      return;
    }
    bodiesRef.current.set(id, body);
  }, []);

  const trackSnapTarget = useCallback(
    (ghost: DragGhost | null) => {
      const layout = layoutRef.current;
      if (!ghost || !layout) {
        setSnapTargetId((prev) => (prev === null ? prev : null));
        return;
      }

      const target = dropTargetOf({
        board: layout.board,
        viewport: layout.viewport,
        slot: slotFor(ghost.id),
        ghost,
      });
      const next = target === 'slot' ? ghost.id : null;
      setSnapTargetId((prev) => (prev === next ? prev : next));
    },
    [slotFor],
  );

  const dropPiece = useCallback(
    (id: number, ghost: DragGhost) => {
      const layout = layoutRef.current;
      if (!layout) return;

      const target = dropTargetOf({
        board: layout.board,
        viewport: layout.viewport,
        slot: slotFor(id),
        ghost,
      });

      if (target === 'slot') {
        setPlacements((prev) => applyDrop({ placements: prev, id, target }));
        onPiecePlaced?.();
        setSnapTargetId(null);
        return;
      }

      if (target === 'tray') {
        setPlacements((prev) => applyDrop({ placements: prev, id, target }));
        setSnapTargetId(null);
        return;
      }

      const loose = loosePlacementOf({
        ghost,
        board: layout.board,
        viewport: layout.viewport,
        cols,
        rows,
      });
      setPlacements((prev) =>
        applyDrop({ placements: prev, id, target, loose }),
      );
      setSnapTargetId(null);
    },
    [cols, onPiecePlaced, rows, slotFor],
  );

  const drag = usePieceDrag({
    cols,
    getLayout: () => layoutRef.current,
    getBody: (id) => bodiesRef.current.get(id) ?? null,
    getOverlayOrigin: () => overlayOriginRef.current,
    onDrop: dropPiece,
    onDragMove: trackSnapTarget,
  });

  const reshuffleTray = useCallback(() => {
    setShuffleNonce((prev) => prev + 1);
  }, []);

  const revealOne = useCallback(() => {
    setPlacements((prev) => {
      const result = revealPiece(prev, trayOrder);
      if (!result) return prev;
      onPiecePlaced?.();
      return result.placements;
    });
  }, [onPiecePlaced, trayOrder]);

  const revealBoardEdges = useCallback(() => {
    setPlacements((prev) => {
      const result = revealEdges(pieces, rows, cols, prev);
      if (!result) return prev;
      for (let i = 0; i < result.ids.length; i++) onPiecePlaced?.();
      return result.placements;
    });
  }, [cols, onPiecePlaced, pieces, rows]);

  return {
    pieces: pieces as BoardPiece[],
    placements,
    trayShuffles: shuffleNonce,
    trayPieces,
    rows,
    cols,
    placedCount,
    totalCount: count,
    isComplete: isBoardComplete(placedCount, count),
    draggingId: drag.draggingId,
    ghostLeft: drag.ghostLeft,
    ghostTop: drag.ghostTop,
    ghostSize: drag.ghostSize,
    isGhostVisible: drag.isGhostVisible,
    snapTargetId,
    panFor: drag.panFor,
    cancelDrag: drag.cancelDrag,
    setLayout,
    setOverlayOrigin,
    setPieceBody,
    reshuffleTray,
    revealOne,
    revealBoardEdges,
  };
};

export type { UsePuzzleBoardOptions };
