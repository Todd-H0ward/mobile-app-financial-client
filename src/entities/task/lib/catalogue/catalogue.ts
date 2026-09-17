import { TASK_REWARD } from '@/entities/economy';

import type { TaskContent, TaskTheme } from '../../model';
import { assertTasksContent } from '../schema';

import TASKS_CONTENT from '@/content/tasks.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const TASKS = assertTasksContent(TASKS_CONTENT).tasks;

export const listTasks = (): readonly TaskContent[] => TASKS;

export const getTaskById = (id: string): TaskContent | undefined =>
  TASKS.find((task) => task.id === id);

export const listTasksByTheme = (theme: TaskTheme): readonly TaskContent[] =>
  TASKS.filter((task) => task.theme === theme);

/**
 * Coin payout for a task. Difficulty comes from content; the amount comes
 * from the economy table — never from the JSON row.
 */
export const rewardForTask = (task: TaskContent): number =>
  TASK_REWARD[task.difficulty];
