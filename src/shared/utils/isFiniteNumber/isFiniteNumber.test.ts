import { describe, expect, it } from 'vitest';

import { isFiniteNumber } from './isFiniteNumber';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('isFiniteNumber', () => {
  it('accepts ordinary numbers, zero and negatives included', () => {
    expect(isFiniteNumber(50)).toBe(true);
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(-12.5)).toBe(true);
  });

  it('rejects NaN and both infinities', () => {
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it('rejects a numeric string — a save read from JSON is full of them', () => {
    expect(isFiniteNumber('50')).toBe(false);
  });

  it('rejects null, undefined and the rest', () => {
    expect(isFiniteNumber(null)).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
    expect(isFiniteNumber({})).toBe(false);
    expect(isFiniteNumber(true)).toBe(false);
  });
});
