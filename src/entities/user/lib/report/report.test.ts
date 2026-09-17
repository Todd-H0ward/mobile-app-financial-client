import { describe, expect, it } from 'vitest';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave, WalletEntry } from '../../model/types';

import { buildParentsReport } from './report';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const entry = (
  over: Partial<WalletEntry> & Pick<WalletEntry, 'source' | 'amount'>,
): WalletEntry => ({
  id: `${over.source}:${over.periodIndex ?? 1}:${over.amount}`,
  kind: 'earn',
  direction: null,
  periodIndex: 1,
  at: 0,
  ...over,
});

/** A profile with a wallet written by hand — the report only ever reads. */
const withWallet = (history: WalletEntry[], over: Partial<UserSave> = {}) => {
  const user = createInitialUser({ playerName: 'Аня', createdAt: 0 });

  return {
    ...user,
    ...over,
    // Newest first, the way the wallet actually stores it.
    wallet: { ...user.wallet, history: [...history].reverse() },
  };
};

// ═══════════════════════════════════════════
// 1. Coins per period
// ═══════════════════════════════════════════

describe('earnings', () => {
  it('splits what came in from what went out, period by period', () => {
    const report = buildParentsReport(
      withWallet([
        entry({ source: 'task:enough-for-all', amount: 10, periodIndex: 1 }),
        entry({ source: 'task:buy-first', amount: 18, periodIndex: 1 }),
        entry({
          source: 'purchase:bread',
          amount: 8,
          kind: 'spend',
          direction: 'needs',
          periodIndex: 1,
        }),
      ]),
    );

    expect(report.earnings[0]).toEqual({
      periodIndex: 1,
      earned: 28,
      spent: 8,
    });
  });

  it('reads oldest first, so a chart runs left to right like a calendar', () => {
    const report = buildParentsReport(
      withWallet(
        [
          entry({ source: 'bonus:regularity', amount: 5, periodIndex: 3 }),
          entry({ source: 'bonus:regularity', amount: 5, periodIndex: 1 }),
          entry({ source: 'bonus:regularity', amount: 5, periodIndex: 2 }),
        ],
        { period: { ...createInitialUser().period, index: 3 } },
      ),
    );

    expect(report.earnings.map((row) => row.periodIndex)).toEqual([1, 2, 3]);
  });

  it('always gives the running period a column, even at zero', () => {
    const report = buildParentsReport(withWallet([]));

    expect(report.earnings).toEqual([{ periodIndex: 1, earned: 0, spent: 0 }]);
  });
});

// ═══════════════════════════════════════════
// 2. Chores by theme — counted off the coins they paid
// ═══════════════════════════════════════════

describe('tasks', () => {
  it('counts a finished chore under its own theme', () => {
    const report = buildParentsReport(
      withWallet([
        entry({ source: 'task:enough-for-all', amount: 10 }),
        entry({ source: 'task:buy-first', amount: 10 }),
        entry({ source: 'task:save-for-scooter', amount: 18 }),
      ]),
    );

    const byTheme = Object.fromEntries(
      report.tasksByTheme.map((row) => [row.theme, row.done]),
    );

    expect(byTheme.planning).toBe(2);
    expect(byTheme.savings).toBe(1);
    expect(report.tasksDone).toBe(3);
  });

  it('keeps a theme nobody touched, at zero', () => {
    const report = buildParentsReport(
      withWallet([entry({ source: 'task:enough-for-all', amount: 10 })]),
    );

    expect(report.tasksByTheme).toHaveLength(3);
    expect(report.tasksByTheme.every((row) => row.done >= 0)).toBe(true);
    expect(report.tasksDone).toBe(1);
  });

  it('counts only chores — a purchase or a bonus is not one', () => {
    const report = buildParentsReport(
      withWallet([
        entry({ source: 'bonus:regularity', amount: 5 }),
        entry({ source: 'wallet:starting', amount: 50 }),
        entry({
          source: 'purchase:bread',
          amount: 8,
          kind: 'spend',
          direction: 'needs',
        }),
      ]),
    );

    expect(report.tasksDone).toBe(0);
  });
});

// ═══════════════════════════════════════════
// 3. The pet's stage
// ═══════════════════════════════════════════

describe('growth', () => {
  it('names the stage and what the next one still needs', () => {
    const report = buildParentsReport(withWallet([]));

    expect(report.growth.stage).toBe('baby');
    expect(report.growth.progress).toMatchObject({ next: 'teen' });
  });

  it('counts the history rather than a stored counter', () => {
    const base = createInitialUser();
    const report = buildParentsReport(
      withWallet([], {
        history: [
          {
            index: 1,
            plan: { needs: 10, wants: 5, savings: 5 },
            fact: { needs: 8, wants: 4, savings: 5 },
            isPlanKept: true,
            reachedGoalIds: ['paints'],
            endedAt: 1,
          },
        ],
        period: { ...base.period, index: 2 },
      }),
    );

    // One period, one goal, one kept plan — teen still wants a second period.
    expect(report.growth.progress).toMatchObject({
      next: 'teen',
      periods: 1,
      goalsReached: 0,
      plansKept: 0,
    });
  });

  it('has nothing left to ask once the pet is grown', () => {
    const report = buildParentsReport(
      withWallet([], { pet: { ...createInitialUser().pet, stage: 'adult' } }),
    );

    expect(report.growth.progress).toBeNull();
  });
});

// ═══════════════════════════════════════════
// 4. Plan versus fact
// ═══════════════════════════════════════════

describe('the last period', () => {
  it('is null before the first settlement', () => {
    expect(buildParentsReport(withWallet([])).lastPeriod).toBeNull();
  });

  it('is the most recent record, not the first', () => {
    const base = createInitialUser();
    const record = (index: number) => ({
      index,
      plan: { needs: index, wants: 0, savings: 0 },
      fact: { needs: index, wants: 0, savings: 0 },
      isPlanKept: true,
      reachedGoalIds: [],
      endedAt: index,
    });

    const report = buildParentsReport(
      withWallet([], {
        history: [record(1), record(2), record(3)],
        period: { ...base.period, index: 4 },
      }),
    );

    expect(report.lastPeriod?.index).toBe(3);
  });
});
