import { useCallback, useEffect, useRef } from 'react';

import { type View as RNView, StyleSheet, View } from 'react-native';

import type { PuzzleLevel, ScreenRect } from '@/entities/minigame/puzzle';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Text } from '@/shared/ui';

import { puzzleImageUri } from '../lib/puzzle-image-uri';
import { usePuzzleBoard } from '../model/use-puzzle-board';

import { PieceGhost } from './piece-ghost';
import { PuzzleBoard } from './puzzle-board';
import { PuzzleTray } from './puzzle-tray';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PuzzleSceneProps {
  puzzle: PuzzleLevel;
  onComplete: () => void;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Board + tray + ghost for one sitting. Completion is reported once upward.
 */
export const PuzzleScene = ({ puzzle, onComplete }: PuzzleSceneProps) => {
  const theme = useTheme();
  const image = puzzleImageUri(puzzle.imageKey);
  const didComplete = useRef(false);
  const rootRef = useRef<RNView>(null);

  const board = usePuzzleBoard({
    puzzleId: puzzle.id,
    difficulty: puzzle.difficulty,
  });
  const { setLayout, setOverlayOrigin, isComplete } = board;

  useEffect(() => {
    if (!isComplete || didComplete.current) return;
    didComplete.current = true;
    onComplete();
  }, [isComplete, onComplete]);

  const boardRectRef = useRef<ScreenRect | null>(null);
  const viewportRectRef = useRef<ScreenRect | null>(null);

  const syncLayout = useCallback(() => {
    if (!boardRectRef.current) {
      setLayout(null);
      return;
    }
    setLayout({
      board: boardRectRef.current,
      viewport: viewportRectRef.current,
    });
  }, [setLayout]);

  const onRootLayout = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => {
      setOverlayOrigin(x, y);
    });
  }, [setOverlayOrigin]);

  const onBoardRect = useCallback(
    (rect: ScreenRect) => {
      boardRectRef.current = rect;
      syncLayout();
    },
    [syncLayout],
  );

  const onViewportRect = useCallback(
    (rect: ScreenRect) => {
      viewportRectRef.current = rect;
      syncLayout();
    },
    [syncLayout],
  );

  const progress = Math.round((board.placedCount / board.totalCount) * 100);
  const draggingId = board.draggingId;
  const draggingPiece =
    draggingId != null ? board.pieces[draggingId] : undefined;

  return (
    <View
      ref={rootRef}
      style={[styles.root, { backgroundColor: theme.background }]}
      onLayout={onRootLayout}
    >
      <View style={styles.meta}>
        <Text variant="small" themeColor="textMuted">
          {board.placedCount}/{board.totalCount} · {progress}%
        </Text>
      </View>

      <PuzzleBoard
        pieces={board.pieces}
        rows={board.rows}
        cols={board.cols}
        image={image}
        snapTargetId={board.snapTargetId}
        draggingId={draggingId}
        panFor={board.panFor}
        onBoardRect={onBoardRect}
        onViewportRect={onViewportRect}
        onPieceBody={board.setPieceBody}
      />

      <PuzzleTray
        image={image}
        trayPieces={board.trayPieces}
        boardCols={board.cols}
        boardRows={board.rows}
        draggingId={draggingId}
        panFor={board.panFor}
        onPieceBody={board.setPieceBody}
        onReshuffle={board.reshuffleTray}
      />

      {draggingPiece && (
        <PieceGhost
          piece={draggingPiece}
          image={image}
          cols={board.cols}
          rows={board.rows}
          left={board.ghostLeft}
          top={board.ghostTop}
          size={board.ghostSize}
          isVisible={board.isGhostVisible}
        />
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  meta: {
    gap: SPACING.one,
    paddingBottom: SPACING.two,
    paddingHorizontal: SPACING.three,
  },
  root: {
    flex: 1,
  },
});

export type { PuzzleSceneProps };
