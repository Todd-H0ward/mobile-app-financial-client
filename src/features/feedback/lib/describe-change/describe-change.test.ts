import { describe, expect, it } from 'vitest';

import { STARTING_BALANCE } from '@/entities/economy';

import { describeChange, type FeedbackSnapshot } from './describe-change';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const baseSnapshot = (): FeedbackSnapshot => ({
  balance: STARTING_BALANCE,
  savingsTotal: 10,
  factNeeds: 0,
  factWants: 0,
  factSavings: 0,
  comfort: 0.5,
  spirit: 0.5,
  furnitureCount: 0,
});

// ═══════════════════════════════════════════
describe('describeChange', () => {
  it('lists only metrics that moved', () => {
    const before = baseSnapshot();
    const after: FeedbackSnapshot = {
      ...before,
      balance: before.balance - 8,
      factNeeds: 8,
      comfort: 0.6,
    };

    const report = describeChange({
      before,
      after,
      action: 'purchase',
      params: { item: 'Хлеб' },
    });

    expect(report.titleKey).toBe('feedback.title.purchase');
    expect(report.whyKey).toBe('feedback.why.purchase');
    expect(report.changes.map((line) => line.id)).toEqual([
      'balance',
      'factNeeds',
      'comfort',
    ]);
    expect(report.changes[0]).toMatchObject({
      before: STARTING_BALANCE,
      after: STARTING_BALANCE - 8,
      format: 'money',
    });
  });

  it('switches purchase why when over plan', () => {
    const before = baseSnapshot();
    const after = { ...before, balance: before.balance - 20 };

    const report = describeChange({
      before,
      after,
      action: 'purchase',
      overPlanBy: 5,
    });

    expect(report.whyKey).toBe('feedback.why.purchaseOverPlan');
    expect(report.params.over).toBe(5);
  });

  it('prefers content whyText over a why key', () => {
    const before = baseSnapshot();
    const after = {
      ...before,
      balance: before.balance + 12,
      spirit: 0.55,
    };

    const report = describeChange({
      before,
      after,
      action: 'task',
      whyText: '  Копим понемногу.  ',
      params: { reward: 12 },
    });

    expect(report.whyText).toBe('Копим понемногу.');
    expect(report.whyKey).toBeNull();
    expect(report.changes.map((line) => line.id)).toEqual([
      'balance',
      'spirit',
    ]);
  });

  it('tracks jar and fact.savings on a deposit', () => {
    const before = baseSnapshot();
    const after: FeedbackSnapshot = {
      ...before,
      balance: before.balance - 20,
      savingsTotal: 30,
      factSavings: 20,
    };

    const report = describeChange({
      before,
      after,
      action: 'deposit',
      params: { goal: 'Краски', amount: 20 },
    });

    expect(report.changes.map((line) => line.id)).toEqual([
      'balance',
      'savings',
      'factSavings',
    ]);
  });

  it('still returns a report when nothing measurable moved', () => {
    const snap = baseSnapshot();

    const report = describeChange({
      before: snap,
      after: snap,
      action: 'plan',
    });

    expect(report.changes).toEqual([]);
    expect(report.whyKey).toBe('feedback.why.plan');
  });
});
