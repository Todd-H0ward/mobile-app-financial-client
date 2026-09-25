import { describe, expect, it } from 'vitest';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';
import { finishPeriod, startPeriod } from '../period';

import {
  BUDGET_FAIL_PENALTY_RATE,
  BUDGET_SUCCESS_BONUS,
  buildPeriodReport,
  computeAdjustment,
} from './period-report';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const makeUser = (overrides: Partial<UserSave> = {}): UserSave => ({
  ...createInitialUser({ playerName: 'Аня', createdAt: 0 }),
  ...overrides,
  period: {
    ...createInitialUser().period,
    plan: { needs: 10, wants: 5, savings: 5 },
    ...overrides.period,
  },
});

const makeSummary = (overrides: Partial<UserSave> = {}): UserSave =>
  finishPeriod(startPeriod(makeUser(overrides)));

// ═══════════════════════════════════════════
describe('computeAdjustment', () => {
  it('returns the success bonus when the budget is met', () => {
    expect(computeAdjustment(true, 100)).toBe(BUDGET_SUCCESS_BONUS);
  });

  it('returns −10% of the balance when the budget is broken', () => {
    expect(computeAdjustment(false, 100)).toBe(
      -Math.floor(100 * BUDGET_FAIL_PENALTY_RATE),
    );
  });

  it('never floors the penalty past the whole balance', () => {
    expect(computeAdjustment(false, 3)).toBe(0);
    expect(computeAdjustment(false, 9)).toBe(0);
    expect(computeAdjustment(false, 10)).toBe(-1);
  });
});

describe('buildPeriodReport', () => {
  it('marks the budget met when fact stays within plan', () => {
    const report = buildPeriodReport(makeSummary());
    expect(report.isBudgetMet).toBe(true);
    expect(report.adjustment).toBe(BUDGET_SUCCESS_BONUS);
    expect(report.spentOnCharge).toBe(0);
    expect(report.spentOnModules).toBe(0);
    expect(report.savedAmount).toBe(0);
  });

  it('marks the budget broken and computes the penalty', () => {
    const summary = makeSummary();
    const broken: UserSave = {
      ...summary,
      period: {
        ...summary.period,
        fact: { needs: 10, wants: 20, savings: 0 },
      },
    };
    const report = buildPeriodReport(broken);
    expect(report.isBudgetMet).toBe(false);
    expect(report.adjustment).toBe(
      -Math.floor(broken.wallet.balance * BUDGET_FAIL_PENALTY_RATE),
    );
    expect(report.spentOnModules).toBe(20);
  });

  it('sums earnings from the wallet history of this period', () => {
    const summary = makeSummary();
    const withEarn: UserSave = {
      ...summary,
      wallet: {
        ...summary.wallet,
        history: [
          {
            id: 'e1',
            source: 'task:demo',
            amount: 12,
            kind: 'earn',
            direction: null,
            periodIndex: summary.period.index,
            at: 1,
          },
          {
            id: 'e0',
            source: 'task:old',
            amount: 99,
            kind: 'earn',
            direction: null,
            periodIndex: summary.period.index - 1,
            at: 0,
          },
        ],
        entryCount: 2,
      },
    };
    expect(buildPeriodReport(withEarn).earned).toBe(12);
  });

  it('reads robot charge and spirit from the save', () => {
    const report = buildPeriodReport(
      makeSummary({
        robot: {
          ...createInitialUser().robot,
          charge: 0.42,
          spirit: 0.77,
        },
      }),
    );
    expect(report.robotCharge).toBe(0.42);
    expect(report.robotSpirit).toBe(0.77);
  });
});
