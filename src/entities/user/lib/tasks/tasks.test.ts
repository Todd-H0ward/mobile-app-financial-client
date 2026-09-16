import { describe, expect, it } from 'vitest';

import { listTasks, rewardForTask } from '@/entities/task';

import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';
import { startPeriod } from '../period';

import { applyCompleteTask, issueNextTask, selectTask } from './tasks';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const makeUser = (overrides: Partial<UserSave> = {}): UserSave => ({
  ...createInitialUser({ playerName: 'Аня', createdAt: 0 }),
  ...overrides,
  period: {
    ...createInitialUser().period,
    plan: { needs: 20, wants: 15, savings: 10 },
    ...overrides.period,
  },
});

const makeActive = (time = makeDemoTimeSource()): UserSave =>
  startPeriod(makeUser(), time);

// ═══════════════════════════════════════════
describe('issueNextTask', () => {
  it('puts the first catalogue task on a fresh profile', () => {
    const user = createInitialUser();
    expect(user.tasks.activeTaskId).toBe(listTasks()[0]?.id ?? null);
    expect(user.tasks.completedThisPeriod).toEqual([]);
  });

  it('advances past completed chores in catalogue order', () => {
    const first = listTasks()[0];
    const second = listTasks()[1];
    expect(first && second).toBeTruthy();
    if (!first || !second) return;

    const user = issueNextTask({
      ...makeUser(),
      tasks: {
        activeTaskId: first.id,
        completedThisPeriod: [first.id],
      },
    });

    expect(user.tasks.activeTaskId).toBe(second.id);
  });
});

describe('selectTask', () => {
  it('focuses an available chore', () => {
    const second = listTasks()[1];
    expect(second).toBeDefined();
    if (!second) return;

    const result = selectTask(makeUser(), second.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.tasks.activeTaskId).toBe(second.id);
  });
});

describe('applyCompleteTask', () => {
  it('credits a named task reward and opens the next chore', () => {
    const time = makeDemoTimeSource();
    const task = listTasks()[0];
    expect(task).toBeDefined();
    if (!task) return;

    const before = makeActive(time).wallet.balance;
    const result = applyCompleteTask(makeActive(time), task.id, time);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.reward).toBe(rewardForTask(task));
    expect(result.user.wallet.balance).toBe(before + result.reward);
    expect(result.user.wallet.history[0]).toMatchObject({
      kind: 'earn',
      source: `task:${task.id}`,
      amount: result.reward,
    });
    expect(result.user.tasks.completedThisPeriod).toContain(task.id);
    expect(result.user.tasks.activeTaskId).toBe(listTasks()[1]?.id ?? null);
  });

  it('refuses a second payout in the same period', () => {
    const time = makeDemoTimeSource();
    const task = listTasks()[0];
    expect(task).toBeDefined();
    if (!task) return;

    const first = applyCompleteTask(makeActive(time), task.id, time);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = applyCompleteTask(first.user, task.id, time);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe('already_done');
  });

  it('refuses completion outside the active phase', () => {
    const time = makeDemoTimeSource();
    const task = listTasks()[0];
    expect(task).toBeDefined();
    if (!task) return;

    const result = applyCompleteTask(makeUser(), task.id, time);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('wrong_phase');
  });

  it('still pays at least one coin on a partial share', () => {
    const time = makeDemoTimeSource();
    const task = listTasks()[0];
    expect(task).toBeDefined();
    if (!task) return;

    const result = applyCompleteTask(makeActive(time), task.id, time, 0.01);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reward).toBeGreaterThanOrEqual(1);
  });
});
