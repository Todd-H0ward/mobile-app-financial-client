import { useCallback, useRef } from 'react';

import { type View as RNView, StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  type GestureType,
} from 'react-native-gesture-handler';

import type {
  BoardPiece,
  PieceBody,
  ScreenRect,
} from '@/entities/minigame/puzzle';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { pieceBodyOf } from '../model/use-piece-drag';

import { PuzzlePiece } from './puzzle-piece';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PuzzleBoardProps {
  pieces: BoardPiece[];
  rows: number;
  cols: number;
  image: string;
  snapTargetId: number | null;
  draggingId: number | null;
  panFor: (id: number) => GestureType;
  onBoardRect: (rect: ScreenRect) => void;
  onViewportRect: (rect: ScreenRect) => void;
  onPieceBody: (id: number, body: PieceBody | null) => void;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const measureView = (
  view: RNView | null,
  onRect: (rect: ScreenRect) => void,
) => {
  view?.measureInWindow((x, y, width, height) => {
    onRect({ left: x, top: y, right: x + width, bottom: y + height });
  });
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

interface DraggablePieceProps {
  piece: BoardPiece;
  image: string;
  cols: number;
  rows: number;
  isFitCell: boolean;
  /** Invisible while the ghost is in hand — must stay mounted for the pan. */
  isHidden?: boolean;
  panFor: (id: number) => GestureType;
  onPieceBody: (id: number, body: PieceBody | null) => void;
  style?: object;
}

const DraggablePiece = ({
  piece,
  image,
  cols,
  rows,
  isFitCell,
  isHidden = false,
  panFor,
  onPieceBody,
  style,
}: DraggablePieceProps) => {
  const viewRef = useRef<RNView>(null);

  const refreshBody = () => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      onPieceBody(piece.id, pieceBodyOf({ x, y, width, height }, isFitCell));
    });
  };

  return (
    <GestureDetector gesture={panFor(piece.id)}>
      <View
        ref={viewRef}
        style={style}
        pointerEvents={isHidden ? 'none' : 'auto'}
        onLayout={refreshBody}
        onTouchStart={refreshBody}
      >
        <PuzzlePiece
          tabs={piece.tabs}
          isFitCell={isFitCell}
          photo={{
            image,
            row: piece.targetRow,
            col: piece.targetCol,
            boardCols: cols,
            boardRows: rows,
          }}
        />
      </View>
    </GestureDetector>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Grid of slots, placed photos, and loose pieces on the table.
 * Snap targets are derived from the board rect in the session hook — slots
 * here are visual only.
 */
export const PuzzleBoard = ({
  pieces,
  rows,
  cols,
  image,
  snapTargetId,
  draggingId,
  panFor,
  onBoardRect,
  onViewportRect,
  onPieceBody,
}: PuzzleBoardProps) => {
  const theme = useTheme();
  const viewportRef = useRef<RNView>(null);
  const boardRef = useRef<RNView>(null);

  const reportViewport = useCallback(() => {
    measureView(viewportRef.current, onViewportRect);
  }, [onViewportRect]);

  const reportBoard = useCallback(() => {
    measureView(boardRef.current, onBoardRect);
  }, [onBoardRect]);

  const loosePieces = pieces.filter(
    (piece) => piece.placement.kind === 'loose',
  );

  return (
    <View
      ref={viewportRef}
      style={[styles.viewport, { backgroundColor: theme.surfaceDeep }]}
      onLayout={reportViewport}
    >
      <View
        ref={boardRef}
        style={[styles.board, { aspectRatio: cols / rows }]}
        onLayout={reportBoard}
      >
        {pieces.map((piece) => {
          const isActive = snapTargetId === piece.id;
          const isPlaced = piece.placement.kind === 'placed';

          return (
            <View
              key={`slot-${piece.id}`}
              style={[
                styles.slot,
                {
                  width: `${100 / cols}%`,
                  height: `${100 / rows}%`,
                  left: `${(piece.targetCol * 100) / cols}%`,
                  top: `${(piece.targetRow * 100) / rows}%`,
                },
              ]}
            >
              {!isPlaced && (
                <PuzzlePiece
                  tabs={piece.tabs}
                  variant={isActive ? 'slotActive' : 'slotDark'}
                  isFitCell
                />
              )}
              {isPlaced && draggingId !== piece.id && (
                <PuzzlePiece
                  tabs={piece.tabs}
                  isFitCell
                  photo={{
                    image,
                    row: piece.targetRow,
                    col: piece.targetCol,
                    boardCols: cols,
                    boardRows: rows,
                  }}
                />
              )}
            </View>
          );
        })}

        {loosePieces.map((piece) => {
          if (piece.placement.kind !== 'loose') return null;
          const isHidden = draggingId === piece.id;

          return (
            <DraggablePiece
              key={`loose-${piece.id}`}
              piece={piece}
              image={image}
              cols={cols}
              rows={rows}
              isFitCell
              isHidden={isHidden}
              panFor={panFor}
              onPieceBody={onPieceBody}
              style={[
                styles.loose,
                {
                  width: `${100 / cols}%`,
                  height: `${100 / rows}%`,
                  left: `${piece.placement.x * 100}%`,
                  top: `${piece.placement.y * 100}%`,
                },
                isHidden && styles.looseHidden,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  board: {
    maxHeight: '100%',
    maxWidth: '100%',
    position: 'relative',
    width: '100%',
  },
  loose: {
    position: 'absolute',
    zIndex: 2,
  },
  looseHidden: {
    opacity: 0,
  },
  slot: {
    position: 'absolute',
  },
  viewport: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: SPACING.two,
    width: '100%',
  },
});

export type { PuzzleBoardProps };
