import { describe, expect, it } from 'vitest';

import { PLATFORM_GOAL_ID, PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import { getGoalById } from '@/entities/goal';
import { SCENE_LEVEL_COUNT } from '@/entities/scene';

import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import { isUserSave, migrateUser } from '../../model/migrations';
import type { UserSave } from '../../model/types';
import { endPeriod, finishPeriod } from '../period';

import { applyPlatformUpgrade } from './platform';

const time = makeDemoTimeSource();
const funded = (): UserSave => {
  const user = createInitialUser();
  return {
    ...user,
    period: { ...user.period, phase: 'active' },
    savings: {
      ...user.savings,
      goals: user.savings.goals.map((row) =>
        row.goalId === PLATFORM_GOAL_ID
          ? { ...row, saved: getGoalById(PLATFORM_GOAL_ID)?.price ?? 0 }
          : row,
      ),
    },
  };
};

describe('paid platform progress', () => {
  it('matches the number of physical scene tiers', () => {
    expect(PLATFORM_LEVEL_COUNT).toBe(5);
    expect(SCENE_LEVEL_COUNT).toBe(5);
    expect(PLATFORM_LEVEL_COUNT).toBe(SCENE_LEVEL_COUNT);
  });

  it('purchases all five stages, preserves them after restart, and refuses a sixth', () => {
    let user = funded();
    for (let target = 1; target <= 5; target += 1) {
      user = { ...user, savings: funded().savings };
      const result = applyPlatformUpgrade(user, target, time);
      if (!result.ok) throw new Error(`Stage ${target} was refused`);
      const restored = migrateUser(
        JSON.parse(JSON.stringify(result.user)),
        result.user.version,
      );
      if (!restored) throw new Error(`Stage ${target} failed to restore`);
      user = restored;
      expect(user.platform.level).toBe(target);
      expect(user.platform.receipts).toHaveLength(target);
      expect(applyPlatformUpgrade(user, target, time).ok).toBe(false);
    }
    expect(applyPlatformUpgrade(user, 6, time)).toEqual({
      ok: false,
      reason: 'stale_level',
    });
  });

  it('consumes only the tier jar and records the purchase atomically', () => {
    const user = funded();
    const result = applyPlatformUpgrade(user, 1, time);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.wallet).toEqual(user.wallet);
    expect(result.user.period).toEqual(user.period);
    expect(result.user.robot).toEqual(user.robot);
    expect(result.user.platform.level).toBe(1);
    expect(result.user.platform.receipts).toHaveLength(1);
    expect(
      result.user.savings.goals.find((row) => row.goalId === PLATFORM_GOAL_ID)
        ?.saved,
    ).toBe(0);
    expect(isUserSave(result.user)).toBe(true);
    expect(user.platform.level).toBe(0);
  });

  it('rejects a repeated confirmation even after serialization and migration', () => {
    const result = applyPlatformUpgrade(funded(), 1, time);
    if (!result.ok) throw new Error('Expected a purchase');
    const restored = migrateUser(
      JSON.parse(JSON.stringify(result.user)),
      result.user.version,
    );
    if (!restored) throw new Error('Expected a valid restored save');
    expect(restored.platform.level).toBe(1);
    expect(applyPlatformUpgrade(restored, 1, time)).toEqual({
      ok: false,
      reason: 'stale_level',
    });
  });

  it('rejects an empty jar and preserves the input', () => {
    const user = funded();
    user.savings.goals = user.savings.goals.map((row) => ({
      ...row,
      saved: 0,
    }));
    const before = JSON.stringify(user);
    expect(applyPlatformUpgrade(user, 1, time)).toEqual({
      ok: false,
      reason: 'insufficient_saved',
    });
    expect(JSON.stringify(user)).toBe(before);
  });

  it.each([0, -1, 2, 6, 1.5, Number.NaN])(
    'rejects invalid or skipped tier %s',
    (level) => {
      expect(applyPlatformUpgrade(funded(), level, time).ok).toBe(false);
    },
  );

  it.each(['planning', 'summary'] as const)('rejects the %s phase', (phase) => {
    const user = funded();
    user.period.phase = phase;
    expect(applyPlatformUpgrade(user, 1, time)).toEqual({
      ok: false,
      reason: 'wrong_phase',
    });
  });

  it('keeps the purchased goal in the period report after consuming its jar', () => {
    const result = applyPlatformUpgrade(funded(), 1, time);
    if (!result.ok) throw new Error('Expected a purchase');
    const settled = endPeriod(finishPeriod(result.user));
    expect(settled.platform).toEqual(result.user.platform);
    expect(settled.history.at(-1)?.reachedGoalIds).toContain(PLATFORM_GOAL_ID);
  });

  it('migrates v6 without changing existing money, goals or robot', () => {
    const user = funded();
    const old = {
      ...user,
      version: 6,
      platform: undefined,
      savings: {
        ...user.savings,
        goals: user.savings.goals.filter(
          (row) => row.goalId !== PLATFORM_GOAL_ID,
        ),
      },
    };
    const migrated = migrateUser(old, 6);
    expect(migrated?.wallet).toEqual(user.wallet);
    expect(migrated?.robot).toEqual(user.robot);
    expect(migrated?.platform).toEqual({ level: 0, receipts: [] });
    expect(migrated?.savings.goals.slice(0, -1)).toEqual(old.savings.goals);
    expect(migrated?.savings.goals.at(-1)?.saved).toBe(0);
  });
});
