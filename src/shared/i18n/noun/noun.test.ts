import { describe, expect, it } from 'vitest';

import { formatNoun } from './noun';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const COINS = { one: 'монета', few: 'монеты', many: 'монет' };

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('formatNoun', () => {
  it.each([
    [0, '0 монет'],
    [1, '1 монета'],
    [2, '2 монеты'],
    [4, '4 монеты'],
    [5, '5 монет'],
    [11, '11 монет'],
    [12, '12 монет'],
    [14, '14 монет'],
    [21, '21 монета'],
    [22, '22 монеты'],
    [25, '25 монет'],
    [101, '101 монета'],
    [111, '111 монет'],
    [112, '112 монет'],
  ])('agrees %i with its word in Russian', (count, expected) => {
    expect(formatNoun(count, 'ru', COINS)).toBe(expected);
  });

  it('reads a number already formatted for display, and keeps the formatting', () => {
    expect(formatNoun('1 201', 'ru', COINS)).toBe('1 201 монета');
    expect(formatNoun('1 200', 'ru', COINS)).toBe('1 200 монет');
  });

  it('takes the genitive singular after a fraction', () => {
    expect(
      formatNoun(2.5, 'ru', {
        one: 'период',
        few: 'периода',
        many: 'периодов',
      }),
    ).toBe('2.5 периода');
  });

  it('needs only one and many in English', () => {
    const coins = { one: 'coin', many: 'coins' };
    expect(formatNoun(1, 'en', coins)).toBe('1 coin');
    expect(formatNoun(21, 'en', coins)).toBe('21 coins');
    expect(formatNoun(0, 'en', coins)).toBe('0 coins');
  });

  it('falls back to the bare number when no form is given', () => {
    expect(formatNoun(3, 'ru', {})).toBe('3');
  });
});
