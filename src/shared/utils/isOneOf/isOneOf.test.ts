import { describe, expect, it } from 'vitest';

import { isOneOf } from './isOneOf';

const PHASES = ['planning', 'active', 'summary'] as const;

describe('isOneOf', () => {
  it('accepts a member of the tuple', () => {
    for (const phase of PHASES) {
      expect(isOneOf(phase, PHASES)).toBe(true);
    }
  });

  it('rejects a string that only looks like one', () => {
    expect(isOneOf('banana', PHASES)).toBe(false);
    expect(isOneOf('Planning', PHASES)).toBe(false);
    expect(isOneOf('', PHASES)).toBe(false);
  });

  it('rejects everything that is not a string at all', () => {
    for (const value of [null, undefined, 0, 1, true, {}, [], ['active']]) {
      expect(isOneOf(value, PHASES)).toBe(false);
    }
  });

  it('narrows the value, so no cast is needed after the check', () => {
    const value: unknown = 'active';

    // Type-level assertion: this only compiles if `value` narrowed.
    expect(isOneOf(value, PHASES) ? value.toUpperCase() : null).toBe('ACTIVE');
  });

  it('accepts nothing when the allowed list is empty', () => {
    expect(isOneOf('active', [])).toBe(false);
  });
});
