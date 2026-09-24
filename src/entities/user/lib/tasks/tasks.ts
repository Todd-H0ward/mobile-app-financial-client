import {
  getTaskById,
  isTaskAvailable,
  nextTaskId,
  rewardForTask,
  type TaskContent,
} from '@/entities/task';

import type { TimeSource } from '@/shared/lib/time-source';
import { clamp } from '@/shared/utils';

import type { UserSave } from '../../model';
import { creditWallet } from '../wallet';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TaskOk {
  ok: true;
  user: UserSave;
  task: TaskContent;
  /** Coins credited for this completion. */
  reward: number;
}

interface TaskFail {
  ok: false;
  reason: 'wrong_phase' | 'unknown_task' | 'already_done' | 'not_available';
}

type TaskResult = TaskOk | TaskFail;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Puts the next open chore on the HUD, in catalogue order.
 *
 * Pure re-issue: does not clear completions. Called after a finish and when
 * a new period starts.
 */
export const issueNextTask = (user: UserSave): UserSave => {
  const activeTaskId = nextTaskId(user.tasks.completedThisPeriod);
  if (user.tasks.activeTaskId === activeTaskId) return user;

  return {
    ...user,
    tasks: {
      ...user.tasks,
      activeTaskId,
    },
  };
};

/**
 * Focuses one available chore on the HUD without completing it.
 */
export const selectTask = (user: UserSave, taskId: string): TaskResult => {
  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: 'unknown_task' };
  if (!isTaskAvailable(taskId, user.tasks.completedThisPeriod)) {
    return { ok: false, reason: 'not_available' };
  }

  return {
    ok: true,
    task,
    reward: 0,
    user: {
      ...user,
      tasks: {
        ...user.tasks,
        activeTaskId: taskId,
      },
    },
  };
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Completes a chore: credits the wallet with a named `task:<id>` source and
 * advances the queue (2.5.8 / roadmap 1.16).
 *
 * `rewardShare` (0…1) lets a wrong answer still pay something — arcade rule
 * "nothing can be failed". Defaults to a full payout.
 */
export const applyCompleteTask = (
  user: UserSave,
  taskId: string,
  time: TimeSource,
  rewardShare = 1,
): TaskResult => {
  if (user.period.phase !== 'active') {
    return { ok: false, reason: 'wrong_phase' };
  }

  const task = getTaskById(taskId);
  if (!task) return { ok: false, reason: 'unknown_task' };

  if (user.tasks.completedThisPeriod.includes(taskId)) {
    return { ok: false, reason: 'already_done' };
  }
  if (!isTaskAvailable(taskId, user.tasks.completedThisPeriod)) {
    return { ok: false, reason: 'not_available' };
  }

  const share = clamp(rewardShare, 0, 1);
  const fullReward = rewardForTask(task);
  const reward = Math.max(1, Math.round(fullReward * share));

  const wallet = creditWallet(user.wallet, {
    source: `task:${task.id}`,
    amount: reward,
    direction: null,
    periodIndex: user.period.index,
    at: time.now(),
  });

  const completedThisPeriod = [...user.tasks.completedThisPeriod, task.id];
  const withCompletion: UserSave = {
    ...user,
    wallet,
    tasks: {
      activeTaskId: user.tasks.activeTaskId,
      completedThisPeriod,
    },
    robot: {
      ...user.robot,
      // A finished chore lifts spirit a little — docs/robot-dog.md.
      spirit: clamp(user.robot.spirit + 0.05, 0, 1),
    },
  };

  return {
    ok: true,
    task,
    reward,
    user: issueNextTask(withCompletion),
  };
};

export type { TaskFail, TaskOk, TaskResult };
