import { isRecord } from '@/shared/utils';

import {
  MECHANIC_TYPES,
  type MechanicType,
  TASK_DIFFICULTIES,
  TASK_THEMES,
  type TaskContent,
  type TaskDifficulty,
  type TasksFile,
  type TaskTheme,
} from '../../model';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isPositiveInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isTheme = (value: unknown): value is TaskTheme =>
  typeof value === 'string' &&
  (TASK_THEMES as readonly string[]).includes(value);

const isMechanic = (value: unknown): value is MechanicType =>
  typeof value === 'string' &&
  (MECHANIC_TYPES as readonly string[]).includes(value);

const isDifficulty = (value: unknown): value is TaskDifficulty =>
  typeof value === 'string' &&
  (TASK_DIFFICULTIES as readonly string[]).includes(value);

const assertOptions = (options: unknown, path: string): void => {
  if (!Array.isArray(options) || options.length < 2) {
    throw new Error(`${path}: need at least two options`);
  }

  const ids = new Set<string>();
  let correctCount = 0;

  for (const [index, option] of options.entries()) {
    if (!isRecord(option)) {
      throw new Error(`${path}[${index}]: must be an object`);
    }
    if (!isNonEmptyString(option.id)) {
      throw new Error(`${path}[${index}].id: non-empty string required`);
    }
    if (ids.has(option.id)) {
      throw new Error(`${path}: duplicate option id "${option.id}"`);
    }
    ids.add(option.id);
    if (!isNonEmptyString(option.label)) {
      throw new Error(`${path}[${index}].label: non-empty string required`);
    }
    if (typeof option.isCorrect !== 'boolean') {
      throw new Error(`${path}[${index}].isCorrect: boolean required`);
    }
    if (option.isCorrect) {
      correctCount += 1;
    }
  }

  if (correctCount !== 1) {
    throw new Error(`${path}: exactly one option must be correct`);
  }
};

const assertQuizPayload = (payload: Record<string, unknown>, path: string) => {
  if (!isNonEmptyString(payload.question)) {
    throw new Error(`${path}.question: non-empty string required`);
  }
  assertOptions(payload.options, `${path}.options`);
};

const assertChangePayload = (
  payload: Record<string, unknown>,
  path: string,
) => {
  if (!isPositiveInt(payload.price)) {
    throw new Error(`${path}.price: positive integer required`);
  }
  if (!isPositiveInt(payload.paid)) {
    throw new Error(`${path}.paid: positive integer required`);
  }
  if (payload.paid <= payload.price) {
    throw new Error(`${path}: paid must be greater than price`);
  }
  assertOptions(payload.options, `${path}.options`);
};

const assertBasketPayload = (
  payload: Record<string, unknown>,
  path: string,
) => {
  if (!isPositiveInt(payload.budget)) {
    throw new Error(`${path}.budget: positive integer required`);
  }
  if (!Array.isArray(payload.items) || payload.items.length < 2) {
    throw new Error(`${path}.items: need at least two items`);
  }

  const ids = new Set<string>();
  for (const [index, item] of payload.items.entries()) {
    if (!isRecord(item)) {
      throw new Error(`${path}.items[${index}]: must be an object`);
    }
    if (!isNonEmptyString(item.id)) {
      throw new Error(`${path}.items[${index}].id: non-empty string required`);
    }
    if (ids.has(item.id)) {
      throw new Error(`${path}.items: duplicate id "${item.id}"`);
    }
    ids.add(item.id);
    if (!isNonEmptyString(item.title)) {
      throw new Error(
        `${path}.items[${index}].title: non-empty string required`,
      );
    }
    if (!isPositiveInt(item.price)) {
      throw new Error(
        `${path}.items[${index}].price: positive integer required`,
      );
    }
  }
};

const assertPriorityPayload = (
  payload: Record<string, unknown>,
  path: string,
) => {
  if (!Array.isArray(payload.items) || payload.items.length < 2) {
    throw new Error(`${path}.items: need at least two items`);
  }

  const ids = new Set<string>();
  for (const [index, item] of payload.items.entries()) {
    if (!isRecord(item)) {
      throw new Error(`${path}.items[${index}]: must be an object`);
    }
    if (!isNonEmptyString(item.id)) {
      throw new Error(`${path}.items[${index}].id: non-empty string required`);
    }
    if (ids.has(item.id)) {
      throw new Error(`${path}.items: duplicate id "${item.id}"`);
    }
    ids.add(item.id);
    if (!isNonEmptyString(item.title)) {
      throw new Error(
        `${path}.items[${index}].title: non-empty string required`,
      );
    }
    if (item.kind !== 'need' && item.kind !== 'want') {
      throw new Error(`${path}.items[${index}].kind: "need" | "want"`);
    }
  }
};

const assertDialogPayload = (
  payload: Record<string, unknown>,
  path: string,
) => {
  if (!isNonEmptyString(payload.prompt)) {
    throw new Error(`${path}.prompt: non-empty string required`);
  }
  if (!Array.isArray(payload.choices) || payload.choices.length < 2) {
    throw new Error(`${path}.choices: need at least two choices`);
  }

  const ids = new Set<string>();
  for (const [index, choice] of payload.choices.entries()) {
    if (!isRecord(choice)) {
      throw new Error(`${path}.choices[${index}]: must be an object`);
    }
    if (!isNonEmptyString(choice.id)) {
      throw new Error(
        `${path}.choices[${index}].id: non-empty string required`,
      );
    }
    if (ids.has(choice.id)) {
      throw new Error(`${path}.choices: duplicate id "${choice.id}"`);
    }
    ids.add(choice.id);
    if (!isNonEmptyString(choice.label)) {
      throw new Error(
        `${path}.choices[${index}].label: non-empty string required`,
      );
    }
    if (!isNonEmptyString(choice.consequence)) {
      throw new Error(
        `${path}.choices[${index}].consequence: non-empty string required`,
      );
    }
  }
};

const assertPayload = (
  mechanic: MechanicType,
  payload: unknown,
  path: string,
): void => {
  if (!isRecord(payload)) {
    throw new Error(`${path}: must be an object`);
  }

  switch (mechanic) {
    case 'quiz':
      assertQuizPayload(payload, path);
      break;
    case 'change':
      assertChangePayload(payload, path);
      break;
    case 'basket':
      assertBasketPayload(payload, path);
      break;
    case 'priority':
      assertPriorityPayload(payload, path);
      break;
    case 'dialog':
      assertDialogPayload(payload, path);
      break;
  }
};

const assertTask = (task: unknown, path: string): TaskContent => {
  if (!isRecord(task)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(task.id)) {
    throw new Error(`${path}.id: non-empty string required`);
  }
  if (!isTheme(task.theme)) {
    throw new Error(`${path}.theme: one of ${TASK_THEMES.join(', ')}`);
  }
  if (!isMechanic(task.mechanic)) {
    throw new Error(`${path}.mechanic: one of ${MECHANIC_TYPES.join(', ')}`);
  }
  if (!isNonEmptyString(task.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (!isDifficulty(task.difficulty)) {
    throw new Error(
      `${path}.difficulty: one of ${TASK_DIFFICULTIES.join(', ')}`,
    );
  }
  if ('reward' in task || 'amount' in task || 'coins' in task) {
    throw new Error(
      `${path}: reward amounts belong in TASK_REWARD, not in content`,
    );
  }
  if (!isNonEmptyString(task.brief)) {
    throw new Error(`${path}.brief: non-empty string required`);
  }
  if (!isNonEmptyString(task.explanation)) {
    throw new Error(`${path}.explanation: non-empty string required`);
  }

  assertPayload(task.mechanic, task.payload, `${path}.payload`);

  return task as unknown as TaskContent;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/tasks.json` (or a fixture shaped like it).
 * Broken content must fail in tests, never on the device — 2.5.14 / 3.2.
 */
export const assertTasksContent = (data: unknown): TasksFile => {
  if (!isRecord(data)) {
    throw new Error('tasks content: must be an object');
  }
  if (!Array.isArray(data.tasks)) {
    throw new Error('tasks content: "tasks" must be an array');
  }
  if (data.tasks.length < 6) {
    throw new Error('tasks content: need at least six tasks — 2.5.8');
  }

  const ids = new Set<string>();
  const byTheme: Record<TaskTheme, number> = {
    planning: 0,
    savings: 0,
    payments: 0,
  };

  const tasks = data.tasks.map((task, index) => {
    const parsed = assertTask(task, `tasks[${index}]`);
    if (ids.has(parsed.id)) {
      throw new Error(`tasks: duplicate id "${parsed.id}"`);
    }
    ids.add(parsed.id);
    byTheme[parsed.theme] += 1;
    return parsed;
  });

  for (const theme of TASK_THEMES) {
    if (byTheme[theme] < 2) {
      throw new Error(
        `tasks: theme "${theme}" needs at least two tasks — 2.5.8`,
      );
    }
  }

  return { tasks };
};
