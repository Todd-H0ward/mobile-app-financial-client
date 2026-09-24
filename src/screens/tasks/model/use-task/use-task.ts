import { useState } from 'react';

import { useShowFeedback } from '@/features/feedback';

import {
  getTaskById,
  listTasks,
  rewardForTask,
  type TaskContent,
} from '@/entities/task';
import {
  applyCompleteTask,
  selectTask,
  type UserSave,
  useUpdateUser,
  useUser,
  useUserStore,
} from '@/entities/user';

import { hapticSuccess, useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TaskSheet = 'planning' | null;

interface TaskPlayController {
  task: TaskContent;
  reward: number;
  canPlay: boolean;
  isDone: boolean;
  sheet: TaskSheet;
  /** Returns true when the chore was credited and feedback opened. */
  complete: (rewardShare: number, isCorrect: boolean) => boolean;
  dismissSheet: () => void;
}

interface TasksListRow {
  task: TaskContent;
  reward: number;
  isDone: boolean;
  isActive: boolean;
}

interface TasksListController {
  rows: TasksListRow[];
  canPlay: boolean;
  openTask: (taskId: string) => void;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isSamePeriod = (
  current: UserSave | null,
  rendered: UserSave | null,
): current is UserSave =>
  current !== null &&
  rendered !== null &&
  current.createdAt === rendered.createdAt &&
  current.settings.isDemoMode === rendered.settings.isDemoMode &&
  current.period.index === rendered.period.index;

// ═══════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════

/** Showcase of every catalogue chore for the period. */
export const useTasksList = (): TasksListController => {
  const user = useUser();
  const updateUser = useUpdateUser();
  const canPlay = user?.period.phase === 'active';

  const rows: TasksListRow[] =
    user == null
      ? []
      : listTasks().map((task) => ({
          task,
          reward: rewardForTask(task),
          isDone: user.tasks.completedThisPeriod.includes(task.id),
          isActive: user.tasks.activeTaskId === task.id,
        }));

  return {
    rows,
    canPlay: Boolean(canPlay),
    openTask: (taskId) => {
      const current = useUserStore.getState().user;
      if (!isSamePeriod(current, user) || current.period.phase !== 'active')
        return;
      const result = selectTask(current, taskId);
      if (result.ok) updateUser(() => result.user);
    },
  };
};

/** One chore play session — mechanic scores, then `applyCompleteTask`. */
export const useTaskPlay = (taskId: string): TaskPlayController | null => {
  const user = useUser();
  const updateUser = useUpdateUser();
  const time = useTimeSource();
  const showFeedback = useShowFeedback();
  const task = getTaskById(taskId);

  const [sheet, setSheet] = useState<TaskSheet>(null);

  if (!task || !user) return null;

  const isDone = user.tasks.completedThisPeriod.includes(task.id);
  const canPlay = user.period.phase === 'active' && !isDone;

  return {
    task,
    reward: rewardForTask(task),
    canPlay,
    isDone,
    sheet,

    complete: (rewardShare, _isCorrect) => {
      // A second press may arrive before React renders the updated save.
      // Validate and credit the latest state synchronously, before feedback.
      const current = useUserStore.getState().user;
      if (!isSamePeriod(current, user)) return false;
      if (current.period.phase === 'planning') {
        setSheet('planning');
        return false;
      }

      const outcome = applyCompleteTask(current, task.id, time, rewardShare);
      if (!outcome.ok) return false;

      updateUser(() => outcome.user);
      hapticSuccess();
      showFeedback({
        before: current,
        after: outcome.user,
        action: 'task',
        whyText: task.explanation,
        params: { reward: outcome.reward },
      });
      return true;
    },

    dismissSheet: () => setSheet(null),
  };
};

export type {
  TaskPlayController,
  TaskSheet,
  TasksListController,
  TasksListRow,
};
