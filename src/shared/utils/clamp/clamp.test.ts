import { describe, expect, it } from 'vitest';

import { clamp } from './clamp';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('clamp', () => {
  it('leaves a value inside the range alone', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('pulls a value back to the nearest bound', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('keeps the bounds themselves reachable', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('works with a negative range', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it('lets `max` win when the bounds are passed in backwards', () => {
    // Not a guarantee worth relying on, only a record of what happens: the
    // upper bound is applied last, so it wins. Callers must pass min <= max.
    expect(clamp(5, 10, 0)).toBe(0);
  });
});
