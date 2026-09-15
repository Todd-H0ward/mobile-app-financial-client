import { describe, expect, it } from 'vitest';

import { formatMoney } from './formatMoney';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('formatMoney', () => {
  it('leaves small amounts as they are', () => {
    expect(formatMoney(0)).toBe('0');
    expect(formatMoney(248)).toBe('248');
  });

  it('groups thousands so a big balance stays readable', () => {
    // Non-breaking space is what the ru-RU locale uses.
    expect(formatMoney(12480).replace(/ /g, ' ')).toBe('12 480');
  });

  it('keeps at most two decimals', () => {
    expect(formatMoney(12.345).replace(',', '.')).toBe('12.35');
  });

  it('keeps the sign of a negative amount', () => {
    expect(formatMoney(-26)).toBe('-26');
  });

  it('returns nothing for a broken number', () => {
    expect(formatMoney(Number.NaN)).toBe('');
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('');
  });
});
