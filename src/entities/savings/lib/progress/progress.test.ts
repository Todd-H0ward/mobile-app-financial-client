import { describe, expect, it } from 'vitest';

import { periodsEstimateFor, progressFor, remainingFor } from './progress';

// ═══════════════════════════════════════════
describe('progressFor', () => {
  it('clamps a full jar at 1', () => {
    expect(progressFor(140, 140)).toBe(1);
    expect(progressFor(200, 140)).toBe(1);
  });

  it('returns 0 for an empty or broken price', () => {
    expect(progressFor(0, 140)).toBe(0);
    expect(progressFor(10, 0)).toBe(0);
  });
});

describe('remainingFor', () => {
  it('never goes below zero', () => {
    expect(remainingFor(50, 140)).toBe(90);
    expect(remainingFor(140, 140)).toBe(0);
    expect(remainingFor(200, 140)).toBe(0);
  });
});

describe('periodsEstimateFor', () => {
  it('rounds up whole periods', () => {
    expect(periodsEstimateFor(85, 40)).toBe(3);
    expect(periodsEstimateFor(40, 40)).toBe(1);
  });

  it('returns 0 when nothing is left', () => {
    expect(periodsEstimateFor(0, 40)).toBe(0);
  });

  it('returns null when there is no planned deposit', () => {
    expect(periodsEstimateFor(85, 0)).toBeNull();
  });
});
