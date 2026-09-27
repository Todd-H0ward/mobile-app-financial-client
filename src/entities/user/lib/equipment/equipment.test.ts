import { describe, expect, it } from 'vitest';

import { listTasks, rewardForTask } from '@/entities/task';

import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import { migrateUser } from '../../model/migrations';
import { applyPurchase } from '../purchase';
import { applyCompleteTask, rewardForUserTask } from '../tasks';

import { setModuleInstalled } from './equipment';

const active = () => {
  const user = createInitialUser();
  return { ...user, period: { ...user.period, phase: 'active' as const } };
};

describe('optional module equipment', () => {
  it('keeps a purchase inactive until fitted, and matches the preview to the payout', () => {
    const before = active();
    const time = makeDemoTimeSource();
    const purchase = applyPurchase(before, 'module-sensor', time);
    expect(purchase.ok).toBe(true);
    if (!purchase.ok) throw Error('Purchase failed');
    const task = listTasks()[0];
    expect(rewardForUserTask(purchase.user, task)).toBe(rewardForTask(task));
    const fitted = setModuleInstalled(purchase.user, 'module-sensor', true);
    const result = applyCompleteTask(fitted, task.id, time);
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error('Task failed');
    expect(result.reward).toBe(rewardForUserTask(fitted, task));
    expect(result.reward).toBeGreaterThan(rewardForTask(task));
    expect(fitted.robot).toBe(before.robot);
    expect(fitted.wallet).toBe(purchase.user.wallet);
    expect(fitted.period).toBe(purchase.user.period);
    const removed = setModuleInstalled(fitted, 'module-sensor', false);
    expect(removed.modules.owned).toContain('module-sensor');
    expect(removed.wallet).toBe(fitted.wallet);
    expect(rewardForUserTask(removed, task)).toBe(rewardForTask(task));
  });

  it('rejects unowned modules and duplicate purchases without spending', () => {
    const user = active();
    expect(setModuleInstalled(user, 'module-core', true)).toBe(user);
    expect(setModuleInstalled(user, 'unknown', true)).toBe(user);
    const bought = applyPurchase(user, 'module-sensor', makeDemoTimeSource());
    if (!bought.ok) throw Error('Purchase failed');
    const fitted = setModuleInstalled(bought.user, 'module-sensor', true);
    expect(setModuleInstalled(fitted, 'module-sensor', true)).toBe(fitted);
    expect(
      applyPurchase(fitted, 'module-sensor', makeDemoTimeSource()),
    ).toMatchObject({ ok: false, reason: 'already_owned' });
    expect(fitted.modules.installed).toEqual(['module-sensor']);
  });

  it('preserves the old active bonuses, appearance and progress when upgrading a v16 save', () => {
    const user = active();
    const legacy = {
      ...user,
      version: 16,
      modules: { owned: ['module-sensor', 'module-core'], tier: 2 },
    };
    const migrated = migrateUser(legacy, 16);
    expect(migrated?.modules.installed).toEqual([
      'module-sensor',
      'module-core',
    ]);
    expect(migrated?.wallet).toEqual(user.wallet);
    expect(migrated?.robot).toEqual(user.robot);
    expect(migrated?.history).toEqual(user.history);
    expect(migrated?.savings).toEqual(user.savings);
  });
});
