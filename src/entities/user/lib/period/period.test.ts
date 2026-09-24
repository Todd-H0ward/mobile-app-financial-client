import { describe, expect, it } from 'vitest';

import {
  PERIOD_HISTORY_LIMIT,
  PERIOD_NEED_DECAY,
  REGULARITY_BONUS,
  WALLET_SOURCES,
} from '@/entities/economy';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';

import {
  areNeedsMet,
  canFinishPeriod,
  endPeriod,
  endPeriodStatus,
  finishPeriod,
  startPeriod,
} from './period';

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

/** One full cycle without a wall clock — stamps via optional `at`. */
const runOnePeriod = (user: UserSave, at = 0): UserSave => {
  const planned: UserSave = {
    ...user,
    period: { ...user.period, plan: { needs: 10, wants: 5, savings: 5 } },
  };

  const active = startPeriod(planned, at);
  const summary = finishPeriod(active, at + 1);
  return endPeriod(summary, at + 2);
};

// ═══════════════════════════════════════════
describe('phase transitions — legal paths', () => {
  const user = makeUser();

  it('planning → active via startPeriod', () => {
    expect(startPeriod(user).period.phase).toBe('active');
  });

  it('active → summary via finishPeriod', () => {
    const active = startPeriod(user);
    expect(finishPeriod(active).period.phase).toBe('summary');
  });

  it('summary → planning via endPeriod (settlement is atomic)', () => {
    const summary = finishPeriod(startPeriod(user));
    expect(endPeriod(summary).period.phase).toBe('planning');
  });
});

describe('phase transitions — illegal paths throw', () => {
  const user = makeUser();

  it('startPeriod throws when not in planning', () => {
    expect(() => startPeriod(startPeriod(user))).toThrow('planning');
  });

  it('finishPeriod throws when not in active', () => {
    expect(() => finishPeriod(user)).toThrow('active');
  });

  it('endPeriod throws when not in summary', () => {
    expect(() => endPeriod(user)).toThrow('summary');
  });

  it('startPeriod throws when the plan is all-zero and the wallet is not', () => {
    const emptyPlan = makeUser({
      period: {
        ...createInitialUser().period,
        plan: { needs: 0, wants: 0, savings: 0 },
      },
    });
    expect(() => startPeriod(emptyPlan)).toThrow();
  });

  it('startPeriod allows an empty plan when the wallet is empty', () => {
    const broke = makeUser({
      wallet: { balance: 0, history: [], entryCount: 0 },
      period: {
        ...createInitialUser().period,
        plan: { needs: 0, wants: 0, savings: 0 },
      },
    });
    expect(startPeriod(broke).period.phase).toBe('active');
  });
});

describe('endPeriod — next period shape', () => {
  const user = makeUser();
  const next = endPeriod(finishPeriod(startPeriod(user, 1000), 1001), 1002);

  it('advances the period index and wipes plan/fact', () => {
    expect(next.period.index).toBe(user.period.index + 1);
    expect(next.period.phase).toBe('planning');
    expect(next.period.plan).toEqual({ needs: 0, wants: 0, savings: 0 });
    expect(next.period.fact).toEqual({ needs: 0, wants: 0, savings: 0 });
  });

  it('appends a history row with the stamp', () => {
    expect(next.history).toHaveLength(1);
    expect(next.history[0]?.endedAt).toBe(1002);
    expect(next.history[0]?.index).toBe(user.period.index);
  });

  it('applies one-step need decay', () => {
    const before = createInitialUser({ playerName: 'Аня' });
    const settled = endPeriod(
      finishPeriod(startPeriod(makeUser({ robot: before.robot }))),
    );
    expect(settled.robot.charge).toBeCloseTo(
      clampDecay(before.robot.charge, PERIOD_NEED_DECAY.charge),
    );
    expect(settled.robot.spirit).toBeCloseTo(
      clampDecay(before.robot.spirit, PERIOD_NEED_DECAY.spirit),
    );
  });
});

const clampDecay = (value: number, decay: number) =>
  Math.max(0, Math.min(1, value - decay));

describe('endPeriod — regularity bonus', () => {
  it('credits the bonus when the child deposited', () => {
    const user = makeUser({
      savings: {
        ...createInitialUser().savings,
        depositsThisPeriod: 1,
      },
    });
    const before = user.wallet.balance;
    const next = endPeriod(finishPeriod(startPeriod(user)));
    expect(next.wallet.balance).toBe(before + REGULARITY_BONUS);
    expect(next.wallet.history[0]?.source).toBe(WALLET_SOURCES.regularityBonus);
  });
});

describe('isPlanKept', () => {
  it('marks overspend on a zero-plan direction as not kept', () => {
    const active = startPeriod(makeUser());
    const overspent: UserSave = {
      ...active,
      period: {
        ...active.period,
        plan: { needs: 10, wants: 0, savings: 0 },
        fact: { needs: 10, wants: 5, savings: 0 },
      },
    };
    const result = endPeriod(finishPeriod(overspent));
    expect(result.history[0]?.isPlanKept).toBe(false);
  });
});

describe('guards', () => {
  it('canFinishPeriod is true only in the active phase', () => {
    const user = makeUser();
    expect(canFinishPeriod(user)).toBe(false);
    const active = startPeriod(user);
    expect(canFinishPeriod(active)).toBe(true);
  });

  it('canFinishPeriod stays true after an earn-first empty plan', () => {
    const broke = makeUser({
      wallet: { balance: 0, history: [], entryCount: 0 },
      period: {
        ...createInitialUser().period,
        plan: { needs: 0, wants: 0, savings: 0 },
      },
    });
    expect(canFinishPeriod(startPeriod(broke))).toBe(true);
  });

  it('endPeriodStatus warns when needs are under plan', () => {
    const active = startPeriod(makeUser());
    expect(areNeedsMet(active)).toBe(false);
    expect(endPeriodStatus(active)).toBe('warn');

    const covered: UserSave = {
      ...active,
      period: {
        ...active.period,
        fact: { ...active.period.fact, needs: active.period.plan.needs },
      },
    };
    expect(endPeriodStatus(covered)).toBe('ready');
  });
});

describe('five periods without a wall clock', () => {
  it('runs five settlements in a row', () => {
    let user = makeUser();
    for (let i = 0; i < 5; i += 1) {
      user = runOnePeriod(user, i * 10);
    }
    expect(user.period.index).toBe(6);
    expect(user.history).toHaveLength(5);
  });
});

describe('period history cap', () => {
  it('trims oldest rows once the report window is full', () => {
    let user = makeUser();
    const total = PERIOD_HISTORY_LIMIT + 3;
    for (let i = 0; i < total; i += 1) {
      user = runOnePeriod(user, i * 10);
    }

    expect(user.history).toHaveLength(PERIOD_HISTORY_LIMIT);
    expect(user.history[0]?.index).toBe(total - PERIOD_HISTORY_LIMIT + 1);
    expect(user.history[PERIOD_HISTORY_LIMIT - 1]?.index).toBe(total);
  });
});
