import { describe, expect, it } from 'vitest';

import { TASK_REWARD } from '@/entities/economy';

import {
  assertTasksContent,
  getTaskById,
  listTasks,
  listTasksByTheme,
  MECHANIC_TYPES,
  rewardForTask,
  TASK_THEMES,
  type TaskContent,
} from '../..';

import TASKS_CONTENT from '@/content/tasks.json';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

/** Seventh task of an existing mechanic — proves 2.5.14 without touching .tsx. */
const SEVENTH_TASK: TaskContent = {
  id: 'enough-for-snack',
  theme: 'planning',
  mechanic: 'basket',
  title: 'Хватит ли на перекус?',
  difficulty: 'easy',
  brief: 'Собери перекус в пределах бюджета.',
  explanation: 'Сначала смотрим сумму, потом кладём в корзину.',
  payload: {
    budget: 20,
    items: [
      { id: 'apple', title: 'Яблоко', price: 6 },
      { id: 'cookie', title: 'Печенье', price: 14 },
      { id: 'water', title: 'Вода', price: 5 },
    ],
  },
};

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('content/tasks.json', () => {
  it('passes the schema: ids, themes, mechanics, no raw rewards', () => {
    expect(() => assertTasksContent(TASKS_CONTENT)).not.toThrow();
  });

  it('holds at least six tasks across the three themes — 2.5.8 volume', () => {
    const tasks = listTasks();

    expect(tasks.length).toBeGreaterThanOrEqual(6);
    for (const theme of TASK_THEMES) {
      expect(listTasksByTheme(theme).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('resolves payouts only from TASK_REWARD — amounts stay out of JSON', () => {
    for (const task of listTasks()) {
      expect(rewardForTask(task)).toBe(TASK_REWARD[task.difficulty]);
      expect(task).not.toHaveProperty('reward');
      expect(task).not.toHaveProperty('amount');
      expect(task).not.toHaveProperty('coins');
    }
  });

  it('looks up a task by id without hardcoding titles in the engine', () => {
    const task = getTaskById('change-counting');

    expect(task?.mechanic).toBe('change');
    expect(task?.theme).toBe('payments');
    expect(MECHANIC_TYPES).toContain(task?.mechanic);
  });

  it('accepts a seventh task of an existing mechanic without code changes — 2.5.14', () => {
    const withSeventh = {
      tasks: [...TASKS_CONTENT.tasks, SEVENTH_TASK],
    };

    const parsed = assertTasksContent(withSeventh);
    const added = parsed.tasks.at(-1);

    expect(parsed.tasks).toHaveLength(TASKS_CONTENT.tasks.length + 1);
    expect(added?.id).toBe(SEVENTH_TASK.id);
    expect(added && rewardForTask(added)).toBe(TASK_REWARD.easy);
  });

  it('rejects an unknown mechanic — new kinds need a component', () => {
    expect(() =>
      assertTasksContent({
        tasks: [
          ...TASKS_CONTENT.tasks,
          { ...SEVENTH_TASK, id: 'weird', mechanic: 'telepathy' },
        ],
      }),
    ).toThrow(/mechanic/);
  });
});
