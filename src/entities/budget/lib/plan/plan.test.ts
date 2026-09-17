import { describe, expect, it } from 'vitest';

import { BUDGET_DIRECTIONS } from '@/entities/economy';

import {
  addCoin,
  allocate,
  canConfirm,
  EMPTY_PLAN,
  isValidPlan,
  planSum,
  remainder,
  removeCoin,
  zeroDirections,
} from './plan';

// ═══════════════════════════════════════════
// 1. Remainder and the sum invariant
// ═══════════════════════════════════════════

describe('planSum / remainder', () => {
  it('sums the three directions', () => {
    expect(planSum({ needs: 60, wants: 25, savings: 30 })).toBe(115);
  });

  it('remainder is available minus the sum', () => {
    expect(remainder(120, { needs: 60, wants: 25, savings: 30 })).toBe(5);
  });

  it('an empty plan leaves the whole wallet as remainder', () => {
    expect(remainder(50, EMPTY_PLAN)).toBe(50);
  });
});

// ═══════════════════════════════════════════
// 2. allocate never exceeds available
// ═══════════════════════════════════════════

describe('allocate', () => {
  it('clamps a direction so the plan never exceeds available', () => {
    const plan = { needs: 40, wants: 0, savings: 0 };
    const next = allocate(plan, 'wants', 20, 50);

    expect(next.wants).toBe(10);
    expect(remainder(50, next)).toBe(0);
    expect(isValidPlan(next, 50)).toBe(true);
  });

  it('never goes below zero', () => {
    expect(allocate(EMPTY_PLAN, 'needs', -5, 50).needs).toBe(0);
  });

  it('rounds to whole coins', () => {
    expect(allocate(EMPTY_PLAN, 'needs', 12.6, 50).needs).toBe(13);
  });

  it('leaves the other directions untouched', () => {
    const plan = { needs: 10, wants: 5, savings: 5 };
    const next = allocate(plan, 'needs', 20, 50);

    expect(next).toEqual({ needs: 20, wants: 5, savings: 5 });
  });

  it('returns the same object when the value does not change', () => {
    const plan = { needs: 10, wants: 0, savings: 0 };
    expect(allocate(plan, 'needs', 10, 50)).toBe(plan);
  });

  it('property: after allocate, remainder is never negative', () => {
    const available = 50;
    let plan = EMPTY_PLAN;

    for (const direction of BUDGET_DIRECTIONS) {
      for (const value of [-10, 0, 7, 25, 40, 100, 999]) {
        plan = allocate(plan, direction, value, available);
        expect(remainder(available, plan)).toBeGreaterThanOrEqual(0);
        expect(isValidPlan(plan, available)).toBe(true);
      }
    }
  });
});

// ═══════════════════════════════════════════
// 3. Steppers
// ═══════════════════════════════════════════

describe('addCoin / removeCoin', () => {
  it('addCoin is a no-op when nothing is left', () => {
    const plan = { needs: 50, wants: 0, savings: 0 };
    expect(addCoin(plan, 'wants', 50)).toBe(plan);
  });

  it('removeCoin is a no-op when the direction is empty', () => {
    expect(removeCoin(EMPTY_PLAN, 'needs', 50)).toBe(EMPTY_PLAN);
  });

  it('add then remove returns to the previous allocation', () => {
    const added = addCoin(EMPTY_PLAN, 'savings', 50);
    expect(added.savings).toBe(1);
    expect(removeCoin(added, 'savings', 50)).toEqual(EMPTY_PLAN);
  });
});

// ═══════════════════════════════════════════
// 4. Confirmation rules
// ═══════════════════════════════════════════

describe('canConfirm / zeroDirections', () => {
  it('rejects an all-zero plan when there is money to allocate', () => {
    expect(canConfirm(EMPTY_PLAN)).toBe(false);
    expect(canConfirm(EMPTY_PLAN, 50)).toBe(false);
  });

  it('accepts an empty plan when the wallet is empty', () => {
    expect(canConfirm(EMPTY_PLAN, 0)).toBe(true);
  });

  it('accepts a plan with a single non-zero direction', () => {
    expect(canConfirm({ needs: 0, wants: 1, savings: 0 })).toBe(true);
  });

  it('zero on a direction is allowed and listed', () => {
    const plan = { needs: 0, wants: 10, savings: 0 };
    expect(isValidPlan(plan, 50)).toBe(true);
    expect(zeroDirections(plan)).toEqual(['needs', 'savings']);
  });
});
