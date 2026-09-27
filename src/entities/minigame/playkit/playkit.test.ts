import { describe, expect, it } from 'vitest';

import { PLAYKIT_GAME_IDS } from '../lib/payout';

import {
  isPlaykitAnswerCorrect,
  type PlaykitRound,
  playkitAnswerLabel,
  playkitCorrectLabel,
  playkitRound,
} from './index';

// Hand-built rounds: the scorer is checked against fixed answers, not against
// whatever the day seed happens to deal.
const EXPLANATION = 'why';

const ROUNDS = {
  conveyor: {
    kind: 'conveyor',
    item: 'bread',
    correctBin: 'needs',
    explanation: EXPLANATION,
  },
  scales: {
    kind: 'scales',
    targetNeeds: 30,
    targetWants: 10,
    explanation: EXPLANATION,
  },
  cashier: {
    kind: 'cashier',
    price: 13,
    paid: 20,
    change: 7,
    explanation: EXPLANATION,
  },
  jar: { kind: 'jar', goodSlots: [3, 0], explanation: EXPLANATION },
  pinball: { kind: 'pinball', target: 1, explanation: EXPLANATION },
  memory: {
    kind: 'memory',
    cards: ['a', 'b', 'c', 'a', 'b', 'c'],
    mates: [3, 4, 5, 0, 1, 2],
    explanation: EXPLANATION,
  },
  path: {
    kind: 'path',
    safe: [true, false, false, true, true, false, false, true, true],
    solution: [0, 3, 4, 7, 8],
    explanation: EXPLANATION,
  },
  assemble: {
    kind: 'assemble',
    slots: ['head', 'body', 'legs'],
    parts: ['legs', 'head', 'body'],
    map: [2, 0, 1],
    explanation: EXPLANATION,
  },
  laser: {
    kind: 'laser',
    lines: ['a', 'b', 'c', 'd'],
    waste: [2, 1],
    explanation: EXPLANATION,
  },
  orbit: {
    kind: 'orbit',
    windowStart: 0.25,
    windowEnd: 0.4,
    explanation: EXPLANATION,
  },
} satisfies Record<PlaykitRound['kind'], PlaykitRound>;

const t = (key: string) => `t:${key}`;

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

describe('isPlaykitAnswerCorrect', () => {
  it('scores scales by both pans', () => {
    const round = ROUNDS.scales;
    expect(isPlaykitAnswerCorrect(round, { needs: 30, wants: 10 })).toBe(true);
    expect(isPlaykitAnswerCorrect(round, { needs: 30, wants: 11 })).toBe(false);
    expect(isPlaykitAnswerCorrect(round, null)).toBe(false);
    expect(isPlaykitAnswerCorrect(round, 40)).toBe(false);
  });

  it('scores cashier and pinball by the exact number', () => {
    expect(isPlaykitAnswerCorrect(ROUNDS.cashier, 7)).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.cashier, 8)).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.pinball, 1)).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.pinball, 2)).toBe(false);
  });

  it('scores jar and laser as sets, in any order', () => {
    expect(isPlaykitAnswerCorrect(ROUNDS.jar, [0, 3])).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.jar, ['3', '0'])).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.jar, [0])).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.jar, [0, 4])).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.jar, 0)).toBe(false);

    expect(isPlaykitAnswerCorrect(ROUNDS.laser, [1, 2])).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.laser, [1, 2, 3])).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.laser, [1, 3])).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.laser, 'x')).toBe(false);
  });

  it('scores memory only on a finished board', () => {
    expect(isPlaykitAnswerCorrect(ROUNDS.memory, true)).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.memory, false)).toBe(false);
  });

  it('scores path and assemble in order', () => {
    expect(isPlaykitAnswerCorrect(ROUNDS.path, [0, 3, 4, 7, 8])).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.path, [0, 3, 4, 8, 7])).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.path, [0, 3, 4])).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.path, {})).toBe(false);

    expect(isPlaykitAnswerCorrect(ROUNDS.assemble, [2, 0, 1])).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.assemble, [0, 2, 1])).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.assemble, [2, 0])).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.assemble, null)).toBe(false);
  });

  it('scores orbit inside the window, edges included', () => {
    expect(isPlaykitAnswerCorrect(ROUNDS.orbit, 0.25)).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.orbit, 0.3)).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.orbit, 0.4)).toBe(true);
    expect(isPlaykitAnswerCorrect(ROUNDS.orbit, 0.41)).toBe(false);
    expect(isPlaykitAnswerCorrect(ROUNDS.orbit, '0.3')).toBe(false);
  });

  it('rejects an unknown round kind', () => {
    const round = { kind: 'unknown' } as unknown as PlaykitRound;
    expect(isPlaykitAnswerCorrect(round, true)).toBe(false);
    expect(playkitCorrectLabel(round, t)).toBe('');
  });
});

describe('playkitAnswerLabel', () => {
  it('names a conveyor bin through i18n', () => {
    expect(playkitAnswerLabel(ROUNDS.conveyor, 'wants', t)).toBe(
      't:playkit.bins.wants',
    );
  });

  it('shows both scale pans, defaulting a missing one to zero', () => {
    expect(playkitAnswerLabel(ROUNDS.scales, { needs: 30, wants: 10 }, t)).toBe(
      '30 / 10',
    );
    expect(playkitAnswerLabel(ROUNDS.scales, { needs: 5 }, t)).toBe('5 / 0');
  });

  it('prints numbers, booleans and lists as they are', () => {
    expect(playkitAnswerLabel(ROUNDS.cashier, 7, t)).toBe('7');
    expect(playkitAnswerLabel(ROUNDS.memory, true, t)).toBe('t:playkit.ok');
    expect(playkitAnswerLabel(ROUNDS.memory, false, t)).toBe('t:playkit.miss');
    expect(playkitAnswerLabel(ROUNDS.path, [0, 3, 4], t)).toBe('0, 3, 4');
  });

  it('falls back to a miss when there is no answer', () => {
    expect(playkitAnswerLabel(ROUNDS.cashier, undefined, t)).toBe(
      't:playkit.miss',
    );
    expect(playkitAnswerLabel(ROUNDS.scales, null, t)).toBe('t:playkit.miss');
  });
});

describe('playkitCorrectLabel', () => {
  it('names the right answer for every kind', () => {
    expect(playkitCorrectLabel(ROUNDS.conveyor, t)).toBe(
      't:playkit.bins.needs',
    );
    expect(playkitCorrectLabel(ROUNDS.scales, t)).toBe('30 / 10');
    expect(playkitCorrectLabel(ROUNDS.cashier, t)).toBe('7');
    expect(playkitCorrectLabel(ROUNDS.jar, t)).toBe('3, 0');
    // Pockets are shown to the child from one, not from zero.
    expect(playkitCorrectLabel(ROUNDS.pinball, t)).toBe('2');
    expect(playkitCorrectLabel(ROUNDS.memory, t)).toBe('t:playkit.ok');
    expect(playkitCorrectLabel(ROUNDS.path, t)).toBe('0 → 3 → 4 → 7 → 8');
    expect(playkitCorrectLabel(ROUNDS.assemble, t)).toBe('head · body · legs');
    expect(playkitCorrectLabel(ROUNDS.laser, t)).toBe('2, 1');
    expect(playkitCorrectLabel(ROUNDS.orbit, t)).toBe('25–40%');
  });
});
