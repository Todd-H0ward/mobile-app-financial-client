import type {
  BasketPayload,
  ChangePayload,
  PriorityPayload,
  QuizPayload,
} from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Share of the full reward when the answer is wrong — arcade rule: nothing
 * can be failed, a miss still pays (AGENTS.md / docs).
 */
export const TASK_WRONG_SHARE = 0.5;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TaskScore {
  isCorrect: boolean;
  /** 0…1 passed to `applyCompleteTask`. */
  rewardShare: number;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export const scoreQuiz = (
  payload: QuizPayload,
  optionId: string,
): TaskScore => {
  const option = payload.options.find((row) => row.id === optionId);
  const isCorrect = Boolean(option?.isCorrect);
  return {
    isCorrect,
    rewardShare: isCorrect ? 1 : TASK_WRONG_SHARE,
  };
};

export const scoreChange = (
  payload: ChangePayload,
  optionId: string,
): TaskScore => {
  const option = payload.options.find((row) => row.id === optionId);
  const isCorrect = Boolean(option?.isCorrect);
  return {
    isCorrect,
    rewardShare: isCorrect ? 1 : TASK_WRONG_SHARE,
  };
};

/**
 * Basket is right when something is bought and the total stays within budget.
 */
export const scoreBasket = (
  payload: BasketPayload,
  selectedIds: readonly string[],
): TaskScore => {
  const selected = new Set(selectedIds);
  const total = payload.items
    .filter((item) => selected.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);
  const isCorrect = selectedIds.length > 0 && total <= payload.budget;
  return {
    isCorrect,
    rewardShare: isCorrect ? 1 : TASK_WRONG_SHARE,
  };
};

/**
 * Priority is right when every need sits above every want in the order.
 */
export const scorePriority = (
  payload: PriorityPayload,
  orderedIds: readonly string[],
): TaskScore => {
  const byId = new Map(payload.items.map((item) => [item.id, item]));
  let seenWant = false;
  let isCorrect = orderedIds.length === payload.items.length;

  for (const id of orderedIds) {
    const item = byId.get(id);
    if (!item) {
      isCorrect = false;
      break;
    }
    if (item.kind === 'want') seenWant = true;
    if (item.kind === 'need' && seenWant) {
      isCorrect = false;
      break;
    }
  }

  return {
    isCorrect,
    rewardShare: isCorrect ? 1 : TASK_WRONG_SHARE,
  };
};

/** Dialog always completes — every choice teaches a consequence. */
export const scoreDialog = (): TaskScore => ({
  isCorrect: true,
  rewardShare: 1,
});

export type { TaskScore };
