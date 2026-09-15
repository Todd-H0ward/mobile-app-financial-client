import { describe, expect, it } from 'vitest';

import { HIT_SLOP_SIZE } from '@/shared/constants/a11y';

import { hitSlopFor } from './hitSlop';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('hitSlopFor', () => {
  it('pads a control under 48dp up to the accessibility floor', () => {
    expect(hitSlopFor(40)).toBe(4);
    expect(hitSlopFor(40) * 2 + 40).toBe(HIT_SLOP_SIZE);
  });

  it('returns zero when the control is already large enough', () => {
    expect(hitSlopFor(48)).toBe(0);
    expect(hitSlopFor(56)).toBe(0);
  });

  it('never returns a negative pad', () => {
    expect(hitSlopFor(100)).toBe(0);
  });
});
