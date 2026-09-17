import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { BoardPiece } from '@/entities/minigame/puzzle';

import { PuzzlePiece } from './puzzle-piece';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PieceGhostProps {
  piece: BoardPiece;
  image: string;
  cols: number;
  rows: number;
  left: SharedValue<number>;
  top: SharedValue<number>;
  size: SharedValue<number>;
  isVisible: SharedValue<number>;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Floating copy of the piece under the finger — screen coordinates, above
 * board and tray so the drag crosses the split cleanly.
 */
export const PieceGhost = ({
  piece,
  image,
  cols,
  rows,
  left,
  top,
  size,
  isVisible,
}: PieceGhostProps) => {
  const style = useAnimatedStyle(() => ({
    opacity: isVisible.value,
    left: left.value,
    top: top.value,
    width: size.value,
    height: size.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.root, style]}>
      <PuzzlePiece
        tabs={piece.tabs}
        photo={{
          image,
          row: piece.targetRow,
          col: piece.targetCol,
          boardCols: cols,
          boardRows: rows,
        }}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    elevation: 12,
    position: 'absolute',
    zIndex: 50,
  },
});

export type { PieceGhostProps };
