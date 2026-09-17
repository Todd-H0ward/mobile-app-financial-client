// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Themes required by 2.5.8. The engine routes by theme, not by task id. */
export const TASK_THEMES = ['planning', 'savings', 'payments'] as const;

/**
 * Mechanic kinds the engine knows how to render. A new task of an existing
 * kind is a JSON row; a new kind needs a component — 2.5.14.
 */
export const MECHANIC_TYPES = [
  'quiz',
  'change',
  'basket',
  'priority',
  'dialog',
] as const;

export const TASK_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TaskTheme = (typeof TASK_THEMES)[number];
type MechanicType = (typeof MECHANIC_TYPES)[number];
type TaskDifficulty = (typeof TASK_DIFFICULTIES)[number];

interface TaskOption {
  /** Option id within the task payload. */
  id: string;
    label: string;
    isCorrect: boolean;
}

interface BasketItem {
  id: string;
  title: string;
  price: number;
}

interface PriorityItem {
  id: string;
  title: string;
  kind: 'need' | 'want';
}

interface DialogChoice {
  id: string;
  label: string;
  consequence: string;
}

interface QuizPayload {
  question: string;
  options: TaskOption[];
}

interface ChangePayload {
  price: number;
  paid: number;
  options: TaskOption[];
}

interface BasketPayload {
  budget: number;
  items: BasketItem[];
}

interface PriorityPayload {
  items: PriorityItem[];
}

interface DialogPayload {
  prompt: string;
  choices: DialogChoice[];
}

type TaskPayload =
  | QuizPayload
  | ChangePayload
  | BasketPayload
  | PriorityPayload
  | DialogPayload;

/** One row from `content/tasks.json`. Texts live here, never in components. */
interface TaskContent {
  /** Stable id. The save will address progress by this alone — 3.2. */
  id: string;
  /** One of the three educational themes. */
  theme: TaskTheme;
  /** Which mechanic component renders this task. */
  mechanic: MechanicType;
    title: string;
  /** Maps to `TASK_REWARD` in economy — never a raw coin amount in JSON. */
  difficulty: TaskDifficulty;
    brief: string;
  /** Explanation after the action — «что изменилось и почему». */
  explanation: string;
  /** Mechanic-specific data. Shape depends on `mechanic`. */
  payload: TaskPayload;
}

interface TasksFile {
  tasks: TaskContent[];
}

export type {
  BasketItem,
  BasketPayload,
  ChangePayload,
  DialogChoice,
  DialogPayload,
  MechanicType,
  PriorityItem,
  PriorityPayload,
  QuizPayload,
  TaskContent,
  TaskDifficulty,
  TaskOption,
  TaskPayload,
  TasksFile,
  TaskTheme,
};
