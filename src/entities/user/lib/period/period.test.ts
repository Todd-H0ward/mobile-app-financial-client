import { describe, expect, it } from 'vitest';

import {
  PERIOD_HISTORY_LIMIT,
  PERIOD_NEED_DECAY,
  REGULARITY_BONUS,
  WALLET_SOURCES,
} from '@/entities/economy';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';

import { buildBill } from './build-bill';
import { insulationPayback } from './insulation-payback';
import {
  areNeedsMet,
  canFinishPeriod,
  endPeriod,
  endPeriodStatus,
  finishPeriod,
  startPeriod,
} from './period';
import { setTemperature } from './set-temperature';

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
      finishPeriod(startPeriod(makeUser({ pet: before.pet }))),
    );
    expect(settled.pet.comfort).toBeCloseTo(
      clampDecay(before.pet.comfort, PERIOD_NEED_DECAY.comfort),
    );
    expect(settled.pet.spirit).toBeCloseTo(
      clampDecay(before.pet.spirit, PERIOD_NEED_DECAY.spirit),
    );
  });

  it('decays comfort faster for chilly — trait shifts need speed', () => {
    const before = createInitialUser({ playerName: 'Аня' });
    const chillyPet = { ...before.pet, traitIds: ['chilly'] };
    const settled = endPeriod(
      finishPeriod(startPeriod(makeUser({ pet: chillyPet }))),
    );
    const expectedComfort = clampDecay(
      before.pet.comfort,
      PERIOD_NEED_DECAY.comfort * 1.25,
    );
    expect(settled.pet.comfort).toBeCloseTo(expectedComfort);
    expect(settled.pet.comfort).toBeLessThan(
      clampDecay(before.pet.comfort, PERIOD_NEED_DECAY.comfort),
    );
  });
});

const clampDecay = (value: number, decay: number) =>
  Math.max(0, Math.min(1, value - decay));

describe('endPeriod — heating bill', () => {
  it('charges heating once and bumps fact.needs', () => {
    const warm = makeUser({
      home: {
        ...createInitialUser().home,
        temperature: 0.8,
        insulationIds: [],
        lastBilledPeriod: 0,
      },
    });
    const bill = buildBill(0.8, []);
    expect(bill.total).toBeGreaterThan(0);

    const balanceBefore = warm.wallet.balance;
    const settled = endPeriod(finishPeriod(startPeriod(warm)));

    expect(settled.home.lastBilledPeriod).toBe(warm.period.index);
    expect(settled.wallet.balance).toBe(balanceBefore - bill.total);
    expect(settled.history[0]?.fact.needs).toBe(bill.total);
  });

  it('never drives the wallet below zero on a short bill purse', () => {
    const poor = makeUser({
      wallet: { balance: 3, history: [], entryCount: 0 },
      home: {
        ...createInitialUser().home,
        temperature: 1,
        insulationIds: [],
        lastBilledPeriod: 0,
      },
    });
    const settled = endPeriod(finishPeriod(startPeriod(poor)));
    expect(settled.wallet.balance).toBe(0);
  });
});

describe('endPeriod — regularity bonus', () => {
  it('credits the bonus when the child deposited', () => {
    // Free heat so the heating bill does not net out the bonus under test.
    const user = makeUser({
      savings: {
        ...createInitialUser().savings,
        depositsThisPeriod: 1,
      },
      home: {
        ...createInitialUser().home,
        temperature: 0.3,
        insulationIds: [],
        lastBilledPeriod: 0,
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

describe('buildBill', () => {
  it('is free at or below the free base', () => {
    expect(buildBill(0.3, []).total).toBe(0);
    expect(buildBill(0, []).total).toBe(0);
  });

  it('charges tenths above the base and discounts insulation', () => {
    const plain = buildBill(0.5, []);
    const insulated = buildBill(0.5, ['window']);
    expect(plain.total).toBeGreaterThan(insulated.total);
  });
});

describe('insulationPayback', () => {
  it('says never when heat is free — nothing to save', () => {
    expect(insulationPayback(8, 0.3, []).kind).toBe('never');
  });

  it('names periods at the current thermostat', () => {
    const result = insulationPayback(8, 0.5, []);
    expect(result).toEqual({
      kind: 'periods',
      savingPerPeriod: 4,
      periods: 2,
    });
  });
});

describe('setTemperature', () => {
  it('clamps into 0…1', () => {
    const user = makeUser();
    expect(setTemperature(user, 2).home.temperature).toBe(1);
    expect(setTemperature(user, -1).home.temperature).toBe(0);
  });
});
