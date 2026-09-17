import type { BudgetDirection } from '@/entities/economy';

import type { SortItemContent } from '../../model';
import { listSortItems } from '../catalogue';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One card after it has been put away. */
interface SortPlacement {
  itemId: string;
  chosen: BudgetDirection;
  /** Basket the card belongs to — where it ends up either way. */
  direction: BudgetDirection;
  /** Whether the tap matched. Counted for the summary line, never scored. */
  isCorrect: boolean;
}

/** The sorting step: what is left on the table and what is already away. */
interface SortingState {
  /** Cards still to place, in content order. The head is the card in hand. */
  queue: readonly SortItemContent[];
  /** Cards already put away, oldest first. */
  placed: readonly SortPlacement[];
}

/** What `placeItem` gives back: the next state and what to say about the card. */
interface SortOutcome {
  /** State after the card left the table. Never the same object. */
  state: SortingState;
  placement: SortPlacement;
  /**
   * The rule, in the pet's words. Shown on a miss and on a hit alike: the step
   * teaches the rule, and a child who guessed right deserves to know why.
   */
  explanation: string;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * The sorting step at its start. Cards come from the content catalogue, so a
 * seventh card is a JSON row and not a code change — 2.5.14.
 */
export const createSortingState = (
  items: readonly SortItemContent[] = listSortItems(),
): SortingState => ({
  queue: [...items],
  placed: [],
});

/** The card in hand, or `null` when every card is away. */
export const currentSortItem = (state: SortingState): SortItemContent | null =>
  state.queue[0] ?? null;

/**
 * Puts the card in hand into the basket the child tapped.
 *
 * A miss costs nothing: the card still leaves the table — into its own basket,
 * not the tapped one — and the pet names the rule. Nothing here can fail, so
 * the step always terminates and a child cannot get stuck on a card they do
 * not understand (2.2, 3.5).
 *
 * Returns `null` when there is no card left, so the caller never has to guess
 * whether the step is over.
 */
export const placeSortItem = (
  state: SortingState,
  chosen: BudgetDirection,
): SortOutcome | null => {
  const item = currentSortItem(state);
  if (!item) return null;

  const placement: SortPlacement = {
    itemId: item.id,
    chosen,
    direction: item.direction,
    isCorrect: chosen === item.direction,
  };

  return {
    state: {
      queue: state.queue.slice(1),
      placed: [...state.placed, placement],
    },
    placement,
    explanation: item.explanation,
  };
};

/** Every card is away — the step may move on. */
export const isSortingDone = (state: SortingState): boolean =>
  state.queue.length === 0;

/**
 * Progress as "3 из 6". Steps count what is done, never what is left, and
 * never how long it took — there are no timers in this app.
 */
export const sortingProgress = (
  state: SortingState,
): { done: number; total: number } => ({
  done: state.placed.length,
  total: state.placed.length + state.queue.length,
});

export type { SortingState, SortOutcome, SortPlacement };
