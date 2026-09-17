import { useCallback, useRef, useState } from 'react';

import { Gesture, type GestureType } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import {
  type DragGhost,
  PIECE_BOX_RATIO,
  type PieceBody,
  type ScreenRect,
} from '@/entities/minigame/puzzle';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface BoardLayout {
  board: ScreenRect;
  viewport: ScreenRect | null;
}

interface OverlayOrigin {
  x: number;
  y: number;
}

interface UsePieceDragOptions {
  cols: number;
  getLayout: () => BoardLayout | null;
    getBody: (id: number) => PieceBody | null;
  /**
   * Window origin of the ghost overlay. Hit-testing stays in window space;
   * shared values for the ghost view are converted to overlay-local coords.
   */
  getOverlayOrigin: () => OverlayOrigin;
  onDrop: (id: number, ghost: DragGhost) => void;
  onDragMove?: (ghost: DragGhost | null) => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const DRAG_THRESHOLD = 6;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const pieceBodyOf = (
  frame: { x: number; y: number; width: number; height: number },
  isFitCell: boolean,
): PieceBody => {
  const size = isFitCell ? frame.width : frame.width / PIECE_BOX_RATIO;

  return {
    left: frame.x + (frame.width - size) / 2,
    top: frame.y + (frame.height - size) / 2,
    size,
  };
};

const sizeAt = (
  x: number,
  y: number,
  sourceSize: number,
  cols: number,
  layout: BoardLayout | null,
): number => {
  if (!layout) return sourceSize;

  const { board, viewport } = layout;
  const visible = viewport
    ? {
        left: Math.max(board.left, viewport.left),
        top: Math.max(board.top, viewport.top),
        right: Math.min(board.right, viewport.right),
        bottom: Math.min(board.bottom, viewport.bottom),
      }
    : board;

  const overBoard =
    x >= visible.left &&
    x <= visible.right &&
    y >= visible.top &&
    y <= visible.bottom;

  if (!overBoard) return sourceSize;

  return (board.right - board.left) / cols;
};

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Drag one piece with a screen-space ghost.
 *
 * Position lives only in shared values during the pan — React state updates
 * on every move remounted `Gesture.Pan()` instances and froze the release.
 * Gestures are cached per piece id for the same reason.
 */
export const usePieceDrag = ({
  cols,
  getLayout,
  getBody,
  getOverlayOrigin,
  onDrop,
  onDragMove,
}: UsePieceDragOptions) => {
  /** Which piece is in hand — null when idle. Not updated on every move. */
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const ghostRef = useRef<DragGhost | null>(null);
  const grabRef = useRef<{
    id: number;
    offsetX: number;
    offsetY: number;
    sourceSize: number;
  } | null>(null);
  const gesturesRef = useRef(new Map<number, GestureType>());
  const isEndingRef = useRef(false);

  const onDropRef = useRef(onDrop);
  const onDragMoveRef = useRef(onDragMove);
  const getLayoutRef = useRef(getLayout);
  const getBodyRef = useRef(getBody);
  const getOverlayOriginRef = useRef(getOverlayOrigin);
  const colsRef = useRef(cols);
  onDropRef.current = onDrop;
  onDragMoveRef.current = onDragMove;
  getLayoutRef.current = getLayout;
  getBodyRef.current = getBody;
  getOverlayOriginRef.current = getOverlayOrigin;
  colsRef.current = cols;

  const ghostLeft = useSharedValue(0);
  const ghostTop = useSharedValue(0);
  const ghostSize = useSharedValue(0);
  const isGhostVisible = useSharedValue(0);

  const writeGhostVisual = useCallback(
    (next: DragGhost | null) => {
      ghostRef.current = next;
      onDragMoveRef.current?.(next);

      if (next) {
        const origin = getOverlayOriginRef.current();
        ghostLeft.value = next.left - origin.x;
        ghostTop.value = next.top - origin.y;
        ghostSize.value = next.size;
        isGhostVisible.value = 1;
      } else {
        isGhostVisible.value = 0;
      }
    },
    [ghostLeft, ghostTop, ghostSize, isGhostVisible],
  );

  const beginGrab = useCallback(
    (id: number, absoluteX: number, absoluteY: number) => {
      isEndingRef.current = false;

      let body = getBodyRef.current(id);
      // measureInWindow is async — a re-grab can race the layout callback and
      // see a stale tray body (or none). Fall back to a cell under the finger.
      if (!body || body.size <= 0) {
        const layout = getLayoutRef.current();
        const size = layout
          ? (layout.board.right - layout.board.left) / colsRef.current
          : 72;
        body = {
          left: absoluteX - size / 2,
          top: absoluteY - size / 2,
          size,
        };
      } else {
        // Prefer a live cell size when the piece already sits on the board so
        // snap math matches the silhouette under the finger.
        const layout = getLayoutRef.current();
        if (layout) {
          const cell =
            (layout.board.right - layout.board.left) / colsRef.current;
          const overBoard =
            absoluteX >= layout.board.left &&
            absoluteX <= layout.board.right &&
            absoluteY >= layout.board.top &&
            absoluteY <= layout.board.bottom;
          if (overBoard && Math.abs(body.size - cell) > 1) {
            body = {
              left: absoluteX - cell / 2,
              top: absoluteY - cell / 2,
              size: cell,
            };
          }
        }
      }

      grabRef.current = {
        id,
        offsetX: (absoluteX - body.left) / body.size,
        offsetY: (absoluteY - body.top) / body.size,
        sourceSize: body.size,
      };
      setDraggingId(id);
      writeGhostVisual({
        id,
        size: body.size,
        left: body.left,
        top: body.top,
      });
    },
    [writeGhostVisual],
  );

  const moveGhost = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const grab = grabRef.current;
      if (!grab || isEndingRef.current) return;

      const size = sizeAt(
        absoluteX,
        absoluteY,
        grab.sourceSize,
        colsRef.current,
        getLayoutRef.current(),
      );
      writeGhostVisual({
        id: grab.id,
        size,
        left: absoluteX - grab.offsetX * size,
        top: absoluteY - grab.offsetY * size,
      });
    },
    [writeGhostVisual],
  );

  const endGhost = useCallback(() => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    const dropped = ghostRef.current;
    grabRef.current = null;
    writeGhostVisual(null);
    setDraggingId(null);

    if (dropped) onDropRef.current(dropped.id, dropped);
  }, [writeGhostVisual]);

  const cancelDrag = useCallback(() => {
    const dropped = ghostRef.current;
    grabRef.current = null;
    isEndingRef.current = true;
    writeGhostVisual(null);
    setDraggingId(null);
    return dropped;
  }, [writeGhostVisual]);

  const panFor = useCallback(
    (id: number): GestureType => {
      const cached = gesturesRef.current.get(id);
      if (cached) return cached;

      const gesture = Gesture.Pan()
        .minDistance(DRAG_THRESHOLD)
        .onStart((e) => {
          runOnJS(beginGrab)(id, e.absoluteX, e.absoluteY);
        })
        .onUpdate((e) => {
          runOnJS(moveGhost)(e.absoluteX, e.absoluteY);
        })
        .onEnd(() => {
          runOnJS(endGhost)();
        })
        .onFinalize((_, success) => {
          if (!success) {
            runOnJS(cancelDrag)();
          }
        });

      gesturesRef.current.set(id, gesture);
      return gesture;
    },
    [beginGrab, cancelDrag, endGhost, moveGhost],
  );

  // Drop cached detectors when the JS handlers are rebuilt so a remount
  // does not keep a stale worklet→JS bridge after a hot reload.
  const panForRef = useRef(panFor);
  if (panForRef.current !== panFor) {
    gesturesRef.current.clear();
    panForRef.current = panFor;
  }

  return {
    draggingId,
    ghostLeft,
    ghostTop,
    ghostSize,
    isGhostVisible,
    panFor,
    cancelDrag,
  };
};

export type { BoardLayout, OverlayOrigin, UsePieceDragOptions };
