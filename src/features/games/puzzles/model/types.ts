import type {
  BoardPiece,
  PieceBody,
  Placement,
  PuzzleDifficulty,
  PuzzleLevel,
  PuzzleScore,
} from '@/entities/minigame/puzzle';

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
