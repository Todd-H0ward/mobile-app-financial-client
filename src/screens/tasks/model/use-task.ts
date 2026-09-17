import { useState } from 'react';

import {
  getTaskById,
  listTasks,
  rewardForTask,
  type TaskContent,
} from '@/entities/task';
import {
  applyCompleteTask,
  selectTask,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TaskSheet = 'result' | 'planning' | null;

interface TaskResultView {
  isCorrect: boolean;
  reward: number;
  explanation: string;
}

interface TaskPlayController {
  task: TaskContent;
  reward: number;
  canPlay: boolean;
  isDone: boolean;
  sheet: TaskSheet;
  result: TaskResultView | null;
  complete: (rewardShare: number, isCorrect: boolean) => void;
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
      if (!user) return;
      if (user.period.phase === 'active') {
        const result = selectTask(user, taskId);
        if (result.ok) updateUser(() => result.user);
      }
    },
  };
};

/** One chore play session — mechanic scores, then `applyCompleteTask`. */
export const useTaskPlay = (taskId: string): TaskPlayController | null => {
  const user = useUser();
  const updateUser = useUpdateUser();
  const time = useTimeSource();
  const task = getTaskById(taskId);

  const [sheet, setSheet] = useState<TaskSheet>(null);
  const [result, setResult] = useState<TaskResultView | null>(null);

  if (!task || !user) return null;

  const isDone = user.tasks.completedThisPeriod.includes(task.id);
  const canPlay = user.period.phase === 'active' && !isDone;

  return {
    task,
    reward: rewardForTask(task),
    canPlay,
    isDone,
    sheet,
    result,

    complete: (rewardShare, isCorrect) => {
      if (user.period.phase === 'planning') {
        setSheet('planning');
        return;
      }
      if (!canPlay) return;

      const outcome = applyCompleteTask(user, task.id, time, rewardShare);
      if (!outcome.ok) return;

      updateUser(() => outcome.user);
      setResult({
        isCorrect,
        reward: outcome.reward,
        explanation: task.explanation,
      });
      setSheet('result');
    },

    dismissSheet: () => setSheet(null),
  };
};

export type {
  TaskPlayController,
  TaskResultView,
  TaskSheet,
  TasksListController,
  TasksListRow,
};
