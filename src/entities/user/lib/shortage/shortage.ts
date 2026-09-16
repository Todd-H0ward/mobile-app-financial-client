import { getGoalById } from '@/entities/goal';
import { listTasks, rewardForTask } from '@/entities/task';

import type { SavingsSave } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Numbers the wallet already computed when it refused the debit. */
interface ShortageExplainInput {
  /** Coins still needed: price − balance. Always > 0. */
  shortfall: number;
  /** Catalogue price of the refused item. */
  price: number;
  /** Wallet balance at the moment of refusal. */
  balance: number;
  /** Active savings jar — consequence of "take from the jar". */
  savings: SavingsSave;
}

/** Suggested chore: earn enough (or the closest payout) to close the gap. */
interface ShortageTaskOption {
  kind: 'task';
  /** Content id — used if a tasks screen lands later. */
  taskId: string;
  /** Catalogue title until i18n covers every task. */
  taskTitle: string;
  /** Coins the chore pays (`TASK_REWARD`). */
  reward: number;
  /** True when one chore alone covers the shortfall. */
  coversShortfall: boolean;
}

/**
 * Taking the shortfall from the jar — only offered when the active goal
 * actually holds that many coins.
 */
interface ShortageJarOption {
  kind: 'jar';
  /** Whether the jar can cover the shortfall right now. */
  isAvailable: boolean;
  /** Active goal id, or null when none is picked. */
  goalId: string | null;
  /** Goal title from content, or null. */
  goalTitle: string | null;
  /** Coins already in the jar for that goal. */
  saved: number;
  /** Goal price − saved, before a withdrawal. */
  remainingBefore: number | null;
  /** Goal price − (saved − shortfall), after taking the shortfall. */
  remainingAfter: number | null;
}

/** Always present: wait and buy next period. Soft exit, never a scold. */
interface ShortageWaitOption {
  kind: 'wait';
}

/**
 * Child-readable refusal for 2.5.6 / docs/economy.md — shortfall named, three
 * options with consequences, never a bare "insufficient funds".
 */
interface ShortageExplain {
  shortfall: number;
  price: number;
  balance: number;
  /** Closest covering chore, or the biggest payout if none cover it. */
  task: ShortageTaskOption | null;
  jar: ShortageJarOption;
  wait: ShortageWaitOption;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Prefer the cheapest chore that covers the gap; otherwise the richest one —
 * so the screen never says "earn" without naming how many coins that is.
 */
const pickTask = (shortfall: number): ShortageTaskOption | null => {
  const ranked = listTasks()
    .map((task) => ({
      task,
      reward: rewardForTask(task),
    }))
    .sort((a, b) => a.reward - b.reward);

  if (ranked.length === 0) return null;

  const covering = ranked.find((row) => row.reward >= shortfall);
  const chosen = covering ?? ranked[ranked.length - 1];

  return {
    kind: 'task',
    taskId: chosen.task.id,
    taskTitle: chosen.task.title,
    reward: chosen.reward,
    coversShortfall: chosen.reward >= shortfall,
  };
};

const explainJar = (
  savings: SavingsSave,
  shortfall: number,
): ShortageJarOption => {
  const goalId = savings.activeGoalId;
  const goalSave = goalId
    ? savings.goals.find((row) => row.goalId === goalId)
    : undefined;
  const goal = goalId ? getGoalById(goalId) : undefined;
  const saved = goalSave?.saved ?? 0;
  const isAvailable = Boolean(goal && goalSave && saved >= shortfall);

  if (!goal || !goalSave) {
    return {
      kind: 'jar',
      isAvailable: false,
      goalId,
      goalTitle: goal?.title ?? null,
      saved,
      remainingBefore: null,
      remainingAfter: null,
    };
  }

  const remainingBefore = Math.max(0, goal.price - saved);
  const remainingAfter = Math.max(0, goal.price - (saved - shortfall));

  return {
    kind: 'jar',
    isAvailable,
    goalId,
    goalTitle: goal.title,
    saved,
    remainingBefore,
    remainingAfter: isAvailable ? remainingAfter : null,
  };
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Builds the shortage explanation: how many coins are missing, and three
 * named recovery options with consequences (earn / jar / wait).
 */
export const explainShortage = (
  input: ShortageExplainInput,
): ShortageExplain => {
  const shortfall = Math.max(0, input.shortfall);

  return {
    shortfall,
    price: input.price,
    balance: input.balance,
    task: pickTask(shortfall),
    jar: explainJar(input.savings, shortfall),
    wait: { kind: 'wait' },
  };
};

export type {
  ShortageExplain,
  ShortageExplainInput,
  ShortageJarOption,
  ShortageTaskOption,
  ShortageWaitOption,
};
