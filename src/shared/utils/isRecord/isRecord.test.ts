import { describe, expect, it } from 'vitest';

import { isRecord } from './isRecord';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('isRecord', () => {
  it('accepts a plain object, empty or not', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ balance: 50 })).toBe(true);
  });

  it('rejects null, which `typeof` calls an object', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('rejects an array, which `typeof` also calls an object', () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([{ balance: 50 }])).toBe(false);
  });

  it('rejects primitives and undefined', () => {
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord(7)).toBe(false);
    expect(isRecord('{}')).toBe(false);
    expect(isRecord(false)).toBe(false);
  });

  it('accepts objects from other shapes of construction', () => {
    expect(isRecord(Object.create(null))).toBe(true);
    expect(isRecord(new Date())).toBe(true);
  });
});
