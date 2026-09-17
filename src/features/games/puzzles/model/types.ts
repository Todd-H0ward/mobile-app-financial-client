import type {
  BoardPiece,
  PieceBody,
  Placement,
  PuzzleDifficulty,
  PuzzleLevel,
  PuzzleScore,
} from '@/entities/minigame/puzzle';

/** Progress overlay on a catalogue level for list screens. */
type PuzzleView = PuzzleLevel & {
  number: number;
  title: string;
  score: PuzzleScore;
  isOpened: boolean;
  bestTimeSec: number;
};

export type {
  BoardPiece,
  PieceBody,
  Placement,
  PuzzleDifficulty,
  PuzzleLevel,
  PuzzleScore,
  PuzzleView,
};
