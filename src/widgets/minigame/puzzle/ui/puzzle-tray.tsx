import { useRef } from 'react';

import {
  Pressable,
  type View as RNView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  GestureDetector,
  type GestureType,
} from 'react-native-gesture-handler';

import type { BoardPiece, PieceBody } from '@/entities/minigame/puzzle';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

import { pieceBodyOf } from '../model/use-piece-drag';

import { PuzzlePiece } from './puzzle-piece';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PuzzleTrayProps {
  image: string;
  trayPieces: BoardPiece[];
  boardCols: number;
  boardRows: number;
  draggingId: number | null;
  panFor: (id: number) => GestureType;
  onPieceBody: (id: number, body: PieceBody | null) => void;
  onReshuffle: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const TRAY_PIECE_SIZE = 72;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

interface TrayPieceProps {
  piece: BoardPiece;
  image: string;
  boardCols: number;
  boardRows: number;
  isHidden: boolean;
  panFor: (id: number) => GestureType;
  onPieceBody: (id: number, body: PieceBody | null) => void;
}

const TrayPiece = ({
  piece,
  image,
  boardCols,
  boardRows,
  isHidden,
  panFor,
  onPieceBody,
}: TrayPieceProps) => {
  const viewRef = useRef<RNView>(null);

  const refreshBody = () => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      onPieceBody(piece.id, pieceBodyOf({ x, y, width, height }, false));
    });
  };

  return (
    <GestureDetector gesture={panFor(piece.id)}>
      <View
        ref={viewRef}
        style={[styles.piece, isHidden && styles.pieceHidden]}
        pointerEvents={isHidden ? 'none' : 'auto'}
        onLayout={refreshBody}
        onTouchStart={refreshBody}
      >
        <PuzzlePiece
          tabs={piece.tabs}
          photo={{
            image,
            row: piece.targetRow,
            col: piece.targetCol,
            boardCols,
            boardRows,
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
 * Horizontal tray of remaining pieces. No hint/ad sheet in v1 — reshuffle only.
 */
export const PuzzleTray = ({
  image,
  trayPieces,
  boardCols,
  boardRows,
  draggingId,
  panFor,
  onPieceBody,
  onReshuffle,
}: PuzzleTrayProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text variant="subtitle">
          {t('games.puzzle.trayCount', { count: trayPieces.length })}
        </Text>
        <Pressable
          onPress={onReshuffle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('games.puzzle.reshuffle')}
        >
          <Text variant="small" themeColor="accent">
            {t('games.puzzle.reshuffle')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {trayPieces.map((piece) => (
          <TrayPiece
            key={piece.id}
            piece={piece}
            image={image}
            boardCols={boardCols}
            boardRows={boardRows}
            isHidden={draggingId === piece.id}
            panFor={panFor}
            onPieceBody={onPieceBody}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.two,
  },
  piece: {
    height: TRAY_PIECE_SIZE,
    marginRight: SPACING.two,
    width: TRAY_PIECE_SIZE,
  },
  pieceHidden: {
    opacity: 0,
  },
  root: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: SPACING.three,
    paddingHorizontal: SPACING.three,
    paddingTop: SPACING.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: SPACING.one,
  },
});

export type { PuzzleTrayProps };
