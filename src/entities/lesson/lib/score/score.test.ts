import { describe, expect, it } from 'vitest';

import { isPassed, passMark } from './score';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('passMark', () => {
  it('asks for two of three', () => {
    expect(passMark(3)).toBe(2);
  });

  it('rounds up rather than down — half a question is a whole one', () => {
    expect(passMark(4)).toBe(3);
    expect(passMark(5)).toBe(4);
  });

  it('asks for nothing of an empty test', () => {
    expect(passMark(0)).toBe(0);
  });
});

describe('isPassed', () => {
  it('passes one slip in three', () => {
    expect(isPassed(2, 3)).toBe(true);
    expect(isPassed(3, 3)).toBe(true);
  });

  it('does not pass a guess', () => {
    expect(isPassed(1, 3)).toBe(false);
    expect(isPassed(0, 3)).toBe(false);
  });

  it('does not pass an empty test — there was nothing to understand', () => {
    expect(isPassed(0, 0)).toBe(false);
  });
});
