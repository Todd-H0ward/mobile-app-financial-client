import { describe, expect, it } from 'vitest';

import {
  GATE_MAX,
  GATE_MIN,
  type GateChallenge,
  isGateAnswerCorrect,
  makeGateChallenge,
} from './gate';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A generator that walks a fixed list, so a draw can be asserted. */
const feed = (...values: number[]) => {
  let index = 0;

  return () => values[index++ % values.length] ?? 0;
};

// ═══════════════════════════════════════════
// 1. The question is past a first-grader's table — docs/parents.md
// ═══════════════════════════════════════════

describe('makeGateChallenge', () => {
  it('keeps both factors inside 6…9', () => {
    // Every corner of the generator's range, not a hopeful sample.
    for (const value of [0, 0.24, 0.25, 0.49, 0.5, 0.74, 0.75, 0.999999]) {
      const challenge = makeGateChallenge(feed(value));

      expect(challenge.left).toBeGreaterThanOrEqual(GATE_MIN);
      expect(challenge.left).toBeLessThanOrEqual(GATE_MAX);
      expect(challenge.right).toBeGreaterThanOrEqual(GATE_MIN);
      expect(challenge.right).toBeLessThanOrEqual(GATE_MAX);
    }
  });

  it('reaches both ends of the range', () => {
    expect(makeGateChallenge(feed(0)).left).toBe(GATE_MIN);
    expect(makeGateChallenge(feed(0.999999)).left).toBe(GATE_MAX);
  });

  it('carries the product with the factors', () => {
    const challenge = makeGateChallenge(feed(0.5, 0.999999));

    expect(challenge.answer).toBe(challenge.left * challenge.right);
  });

  it('draws the two factors independently', () => {
    const challenge = makeGateChallenge(feed(0, 0.999999));

    expect(challenge.left).toBe(GATE_MIN);
    expect(challenge.right).toBe(GATE_MAX);
  });

  it('never produces a product a child could guess from the table of two', () => {
    const challenge = makeGateChallenge(feed(0, 0));

    expect(challenge.answer).toBeGreaterThanOrEqual(GATE_MIN * GATE_MIN);
  });
});

// ═══════════════════════════════════════════
// 2. Opening it
// ═══════════════════════════════════════════

describe('isGateAnswerCorrect', () => {
  const challenge: GateChallenge = { left: 7, right: 8, answer: 56 };

  it('opens on the product', () => {
    expect(isGateAnswerCorrect(challenge, '56')).toBe(true);
  });

  it('forgives the spaces around it', () => {
    expect(isGateAnswerCorrect(challenge, '  56 ')).toBe(true);
  });

  it('stays shut on a wrong number', () => {
    expect(isGateAnswerCorrect(challenge, '55')).toBe(false);
    expect(isGateAnswerCorrect(challenge, '78')).toBe(false);
  });

  it('treats anything that is not a whole number as simply wrong', () => {
    // Never an error state: the screen clears the field and waits.
    for (const input of ['', '   ', 'пятьдесят шесть', '56.0', '5 6', '-56']) {
      expect(isGateAnswerCorrect(challenge, input)).toBe(false);
    }
  });

  it('does not let a prefix through', () => {
    expect(isGateAnswerCorrect(challenge, '560')).toBe(false);
    expect(isGateAnswerCorrect(challenge, '5')).toBe(false);
  });
});
