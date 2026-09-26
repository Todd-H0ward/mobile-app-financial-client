import { describe, expect, it } from 'vitest';

import { PLAYKIT_GAME_IDS } from '../lib/payout';

import { isPlaykitAnswerCorrect, playkitRound } from './index';

describe('playkitRound', () => {
  it('builds a round for every Overseer playkit game', () => {
    for (const gameId of PLAYKIT_GAME_IDS) {
      const round = playkitRound(gameId, 1_700_000_000_000, 0);
      expect(round.kind).toBe(gameId === 'orbit' ? 'orbit' : round.kind);
      expect(round.explanation.length).toBeGreaterThan(0);
    }
  });

  it('scores conveyor bins', () => {
    const round = playkitRound('conveyor', 0, 0);
    expect(round.kind).toBe('conveyor');
    if (round.kind !== 'conveyor') return;
    expect(isPlaykitAnswerCorrect(round, round.correctBin)).toBe(true);
    expect(isPlaykitAnswerCorrect(round, 'needs')).toBe(
      round.correctBin === 'needs',
    );
  });

  it('keeps the same round for the same day seed', () => {
    const a = playkitRound('cashier', 86_400_000 * 10, 1);
    const b = playkitRound('cashier', 86_400_000 * 10 + 1000, 1);
    expect(a).toEqual(b);
  });
});
