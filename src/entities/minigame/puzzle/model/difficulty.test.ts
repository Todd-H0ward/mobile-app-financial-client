import { describe, expect, it } from 'vitest';

import { DIFFICULTY_BOARD, PUZZLE_DIFFICULTIES } from './difficulty';

describe('DIFFICULTY_BOARD', () => {
  it('covers every named difficulty with a phone-sized grid', () => {
    expect(PUZZLE_DIFFICULTIES).toEqual([
      'easy',
      'medium',
      'hard',
      'expert',
      'master',
    ]);

    for (const difficulty of PUZZLE_DIFFICULTIES) {
      const board = DIFFICULTY_BOARD[difficulty];
      expect(board.count).toBe(board.cols * board.cols);
      expect(board.cols).toBeGreaterThanOrEqual(3);
      expect(board.cols).toBeLessThanOrEqual(7);
    }
  });
});
