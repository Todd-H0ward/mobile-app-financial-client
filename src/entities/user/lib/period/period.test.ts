import { describe, expect, it } from 'vitest';

import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';

import {
  acknowledgeSummary,
  canFinishPeriod,
  finishPeriod,
  startPeriod,
} from './period';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A minimal user with a non-zero plan so that `startPeriod` passes the guard. */
const makeUser = (overrides: Partial<UserSave> = {}): UserSave => ({
  ...createInitialUser({ playerName: 'Аня', createdAt: 0 }),
  ...overrides,
  period: {
    ...createInitialUser().period,
    plan: { needs: 10, wants: 5, savings: 5 },
    ...overrides.period,
  },
});

/**
 * Run all four transitions once and return the resulting user.
 *
 * After `acknowledgeSummary` the plan resets to zero — the planning UI would
 * fill it before the next `startPeriod`. The helper simulates that step so the
 * demo loop can run five periods end-to-end.
 */
const runOnePeriod = (
  user: UserSave,
  time: ReturnType<typeof makeDemoTimeSource>,
): UserSave => {
  // Simulate the child filling in the plan during the planning phase.
  const planned: UserSave = {
    ...user,
    period: { ...user.period, plan: { needs: 10, wants: 5, savings: 5 } },
  };

  const active = startPeriod(planned, time);
  time.tick();
  const summary = finishPeriod(active, time);
  time.tick();
  const next = acknowledgeSummary(summary, time);
  time.tick();

  return next;
};

// ═══════════════════════════════════════════
// 1. The automaton never skips phases and never leaves the four valid states
// ═══════════════════════════════════════════

describe('phase transitions — legal paths', () => {
  const time = makeDemoTimeSource();
  const user = makeUser();

  it('planning → active via startPeriod', () => {
    const next = startPeriod(user, time);

    expect(next.period.phase).toBe('active');
  });

  it('active → summary via finishPeriod', () => {
    const active = startPeriod(user, time);
    const next = finishPeriod(active, time);

    expect(next.period.phase).toBe('summary');
  });

  it('summary → planning via acknowledgeSummary (settlement is atomic)', () => {
    const active = startPeriod(user, time);
    const summary = finishPeriod(active, time);
    const next = acknowledgeSummary(summary, time);

    expect(next.period.phase).toBe('planning');
  });
});

describe('phase transitions — illegal paths throw', () => {
  const time = makeDemoTimeSource();
  const user = makeUser();

  it('startPeriod throws when not in planning', () => {
    const active = startPeriod(user, time);

    expect(() => startPeriod(active, time)).toThrow('planning');
  });

  it('finishPeriod throws when not in active', () => {
    expect(() => finishPeriod(user, time)).toThrow('active');
  });

  it('acknowledgeSummary throws when not in summary', () => {
    expect(() => acknowledgeSummary(user, time)).toThrow('summary');
  });

  it('startPeriod throws when the plan is all-zero', () => {
    const emptyPlan = makeUser({
      period: {
        ...makeUser().period,
        plan: { needs: 0, wants: 0, savings: 0 },
      },
    });

    expect(() => startPeriod(emptyPlan, time)).toThrow();
  });
});

// ═══════════════════════════════════════════
// 2. settlement always yields a valid planning period for the next index
// ═══════════════════════════════════════════

describe('acknowledgeSummary — next period shape', () => {
  const time = makeDemoTimeSource(1000);
  const user = makeUser();

  const active = startPeriod(user, time);
  time.tick();
  const summary = finishPeriod(active, time);
  time.tick();
  const next = acknowledgeSummary(summary, time);

  it('advances the period index by 1', () => {
    expect(next.period.index).toBe(user.period.index + 1);
  });

  it('resets plan to all-zeros', () => {
    expect(next.period.plan).toEqual({ needs: 0, wants: 0, savings: 0 });
  });

  it('resets fact to all-zeros', () => {
    expect(next.period.fact).toEqual({ needs: 0, wants: 0, savings: 0 });
  });

  it('resets depositsThisPeriod', () => {
    expect(next.savings.depositsThisPeriod).toBe(0);
  });

  it('writes a PeriodRecord to history', () => {
    expect(next.history).toHaveLength(1);
    expect(next.history[0]?.index).toBe(user.period.index);
  });

  it('isPlanKept is true when fact did not exceed plan', () => {
    expect(next.history[0]?.isPlanKept).toBe(true);
  });

  it('isPlanKept is false when a direction is overspent', () => {
    const overspent: UserSave = {
      ...active,
      period: {
        ...active.period,
        phase: 'summary',
        fact: { needs: 99, wants: 0, savings: 0 }, // needs plan was 10
      },
    };

    const result = acknowledgeSummary(overspent, time);

    expect(result.history[result.history.length - 1]?.isPlanKept).toBe(false);
  });
});

// ═══════════════════════════════════════════
// 3. Demo mode — five periods back-to-back, profile remains valid
// ═══════════════════════════════════════════

describe('demo mode — five periods in a row', () => {
  it('runs five full periods and leaves a valid profile', () => {
    const time = makeDemoTimeSource(0);
    let user = makeUser();

    for (let i = 0; i < 5; i++) {
      user = runOnePeriod(user, time);
    }

    // The engine finished 5 periods: index advanced from 1 to 6.
    expect(user.period.index).toBe(6);
    expect(user.period.phase).toBe('planning');
    expect(user.history).toHaveLength(5);

    // History is well-formed: indices are 1 through 5 in order.
    for (let i = 0; i < 5; i++) {
      expect(user.history[i]?.index).toBe(i + 1);
    }

    // Timestamps are strictly ascending (demo tick advances the clock by 1 ms
    // per call, so endedAt values must differ).
    const endedAts = user.history.map((r) => r.endedAt);
    for (let i = 1; i < endedAts.length; i++) {
      const prev = endedAts[i - 1];
      // prev is always defined: the loop starts at i=1 and endedAts has 5 elements.
      if (prev !== undefined) {
        expect(endedAts[i]).toBeGreaterThan(prev);
      }
    }
  });
});

// ═══════════════════════════════════════════
// 4. No calculation depends on Date.now()
//    Substituting demoTimeSource with a shifted clock must yield identical results
// ═══════════════════════════════════════════

describe('time independence', () => {
  /**
   * Run one full period and return the PeriodRecord written to history.
   * The only difference between the two calls is the clock seed.
   */
  const recordWith = (clockSeed: number) => {
    const time = makeDemoTimeSource(clockSeed);
    const user = makeUser();
    const active = startPeriod(user, time);
    time.tick();
    const summary = finishPeriod(active, time);
    time.tick();
    const next = acknowledgeSummary(summary, time);

    return next.history[0];
  };

  it('isPlanKept is the same regardless of the clock', () => {
    // One run at epoch 0, another 30 days later — financial outcome must match.
    const recordA = recordWith(0);
    const recordB = recordWith(30 * 24 * 60 * 60 * 1000);

    expect(recordA?.isPlanKept).toBe(recordB?.isPlanKept);
  });

  it('plan and fact values are the same regardless of the clock', () => {
    const recordA = recordWith(0);
    const recordB = recordWith(1_000_000);

    expect(recordA?.plan).toEqual(recordB?.plan);
    expect(recordA?.fact).toEqual(recordB?.fact);
  });

  it('endedAt differs — it captures the timestamp, not a calculation', () => {
    const recordA = recordWith(0);
    const recordB = recordWith(999);

    // endedAt is supposed to be different (it is a timestamp, not money).
    expect(recordA?.endedAt).not.toBe(recordB?.endedAt);
  });
});

// ═══════════════════════════════════════════
// canFinishPeriod guard
// ═══════════════════════════════════════════

describe('canFinishPeriod', () => {
  const time = makeDemoTimeSource();
  const user = makeUser();

  it('false in planning phase', () => {
    expect(canFinishPeriod(user)).toBe(false);
  });

  it('true in active phase with a non-zero plan', () => {
    const active = startPeriod(user, time);

    expect(canFinishPeriod(active)).toBe(true);
  });

  it('false in summary phase', () => {
    const active = startPeriod(user, time);
    time.tick();
    const summary = finishPeriod(active, time);

    expect(canFinishPeriod(summary)).toBe(false);
  });
});

// ═══════════════════════════════════════════
// isPlanKept — every direction counts
// ═══════════════════════════════════════════

describe('isPlanKept', () => {
  /** Runs one period with the given plan and fact, and reports the verdict. */
  const verdictFor = (
    plan: UserSave['period']['plan'],
    fact: UserSave['period']['fact'],
  ): boolean => {
    const time = makeDemoTimeSource();
    let user = makeUser({ period: { ...makeUser().period, plan } });

    user = startPeriod(user, time);
    time.tick();
    user = { ...user, period: { ...user.period, fact } };
    user = finishPeriod(user, time);
    time.tick();
    user = acknowledgeSummary(user, time);

    return user.history[0].isPlanKept;
  };

  it('kept when every direction stayed inside its allocation', () => {
    expect(
      verdictFor(
        { needs: 10, wants: 5, savings: 5 },
        { needs: 10, wants: 3, savings: 0 },
      ),
    ).toBe(true);
  });

  it('broken when a direction went over its allocation', () => {
    expect(
      verdictFor(
        { needs: 10, wants: 5, savings: 5 },
        { needs: 11, wants: 0, savings: 0 },
      ),
    ).toBe(false);
  });

  it('broken when money went where nothing was allocated', () => {
    // Spending in a direction with a zero plan is the plainest way to break a
    // plan — it must never score as kept.
    expect(
      verdictFor(
        { needs: 10, wants: 0, savings: 0 },
        { needs: 5, wants: 999, savings: 0 },
      ),
    ).toBe(false);
  });
});

// ═══════════════════════════════════════════
// The pet grows on settlement — docs/pet.md
// ═══════════════════════════════════════════

describe('growth', () => {
  it('leaves a pet a baby until the whole formula is met', () => {
    const time = makeDemoTimeSource(0);
    let user = makeUser();

    // Two periods with a kept plan, but no goal reached: teen asks for one.
    user = runOnePeriod(user, time);
    user = runOnePeriod(user, time);

    expect(user.history).toHaveLength(2);
    expect(user.history.every((record) => record.isPlanKept)).toBe(true);
    expect(user.pet.stage).toBe('baby');
  });

  it('grows the pet once the periods, a goal and a kept plan add up', () => {
    const time = makeDemoTimeSource(0);
    const base = makeUser();
    // A goal reached in period 1 — the condition the two periods were missing.
    const withGoal: UserSave = {
      ...base,
      savings: {
        ...base.savings,
        goals: base.savings.goals.map((goal, index) =>
          index === 0 ? { ...goal, reachedInPeriod: 1 } : goal,
        ),
      },
    };

    let user = runOnePeriod(withGoal, time);
    expect(user.pet.stage).toBe('baby');

    user = runOnePeriod(user, time);
    expect(user.pet.stage).toBe('teen');
  });

  it('never takes a stage back, whatever the later periods look like', () => {
    const time = makeDemoTimeSource(0);
    const grown: UserSave = {
      ...makeUser(),
      pet: { ...makeUser().pet, stage: 'adult' },
    };

    const user = runOnePeriod(grown, time);

    expect(user.pet.stage).toBe('adult');
  });

  it('owes a ceremony for a stage the child has not been shown yet', () => {
    const time = makeDemoTimeSource(0);
    const base = makeUser();
    const withGoal: UserSave = {
      ...base,
      savings: {
        ...base.savings,
        goals: base.savings.goals.map((goal, index) =>
          index === 0 ? { ...goal, reachedInPeriod: 1 } : goal,
        ),
      },
    };

    const user = runOnePeriod(runOnePeriod(withGoal, time), time);

    expect(user.pet.stage).toBe('teen');
    // Settlement grows the pet and owes the scene; showing it is the screen's
    // job, and only that catches `celebratedStage` up.
    expect(user.pet.celebratedStage).toBe('baby');
  });
});
