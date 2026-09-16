import { describe, expect, it } from 'vitest';

import { BUDGET_DIRECTIONS } from '@/entities/economy';

import { EMPTY_PLAN } from '../../model';

import { compare, isOnPlan } from './compare';

// ═══════════════════════════════════════════
describe('compare', () => {
  it('returns a row for every direction even when both sides are zero', () => {
    const rows = compare(EMPTY_PLAN, EMPTY_PLAN);

    expect(rows).toHaveLength(BUDGET_DIRECTIONS.length);
    expect(rows.map((row) => row.direction)).toEqual([...BUDGET_DIRECTIONS]);
    expect(rows.every((row) => row.planned === 0 && row.actual === 0)).toBe(
      true,
    );
  });

  it('delta is actual minus planned', () => {
    const rows = compare(
      { needs: 60, wants: 25, savings: 30 },
      { needs: 58, wants: 40, savings: 15 },
    );

    expect(rows).toEqual([
      { direction: 'needs', planned: 60, actual: 58, delta: -2 },
      { direction: 'wants', planned: 25, actual: 40, delta: 15 },
      { direction: 'savings', planned: 30, actual: 15, delta: -15 },
    ]);
  });
});

describe('isOnPlan', () => {
  it('true when delta is within tolerance (exact match at 0)', () => {
    expect(
      isOnPlan({ direction: 'needs', planned: 10, actual: 10, delta: 0 }),
    ).toBe(true);
  });

  it('false when the child overspent or underspent', () => {
    expect(
      isOnPlan({ direction: 'wants', planned: 25, actual: 40, delta: 15 }),
    ).toBe(false);
    expect(
      isOnPlan({ direction: 'savings', planned: 30, actual: 15, delta: -15 }),
    ).toBe(false);
  });
});
