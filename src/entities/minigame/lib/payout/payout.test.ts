import { describe, expect, it } from 'vitest';

import { GAME_REWARDS, payoutFor, WRONG_ROUND_SHARE } from './payout';

describe('payoutFor', () => {
  it('pays the full reward on a correct sitting', () => {
    expect(payoutFor({ gameId: 'puzzle', isCorrect: true })).toBe(
      GAME_REWARDS.puzzle,
    );
    expect(payoutFor({ gameId: 'spacewar', isCorrect: true })).toBe(
      GAME_REWARDS.spacewar,
    );
    expect(payoutFor({ gameId: 'snake', isCorrect: true })).toBe(
      GAME_REWARDS.snake,
    );
  });

  it('pays a share on a miss and never zero', () => {
    const coins = payoutFor({ gameId: 'puzzle', isCorrect: false });
    expect(coins).toBe(
      Math.max(1, Math.round(GAME_REWARDS.puzzle * WRONG_ROUND_SHARE)),
    );
    expect(coins).toBeGreaterThan(0);
    expect(payoutFor({ gameId: 'snake', isCorrect: false })).toBeGreaterThan(0);
  });
});
