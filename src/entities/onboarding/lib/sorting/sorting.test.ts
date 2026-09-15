import { describe, expect, it } from 'vitest';

import { BUDGET_DIRECTIONS } from '@/entities/economy';

import {
  createSortingState,
  currentSortItem,
  isSortingDone,
  listSortItems,
  placeSortItem,
  type SortingState,
  sortingProgress,
} from '../..';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Walks the whole step, answering every card the same way. */
const walk = (
  answer: (state: SortingState) => (typeof BUDGET_DIRECTIONS)[number],
) => {
  let state = createSortingState();
  const outcomes = [];

  while (!isSortingDone(state)) {
    const outcome = placeSortItem(state, answer(state));
    if (!outcome) break;

    outcomes.push(outcome);
    state = outcome.state;
  }

  return { state, outcomes };
};

// ═══════════════════════════════════════════
// 1. The step always terminates
// ═══════════════════════════════════════════

describe('the sorting step cannot be failed — 2.2', () => {
  it('finishes even when every single card goes to the wrong basket', () => {
    // Deliberately the basket the card does not belong to.
    const { state, outcomes } = walk((current) => {
      const item = currentSortItem(current);
      return BUDGET_DIRECTIONS.find((d) => d !== item?.direction) ?? 'needs';
    });

    expect(isSortingDone(state)).toBe(true);
    expect(outcomes.every((outcome) => outcome.placement.isCorrect)).toBe(
      false,
    );
    expect(state.placed).toHaveLength(listSortItems().length);
  });

  it('finishes when every card goes to the right basket', () => {
    const { state, outcomes } = walk(
      (current) => currentSortItem(current)?.direction ?? 'needs',
    );

    expect(isSortingDone(state)).toBe(true);
    expect(outcomes.every((outcome) => outcome.placement.isCorrect)).toBe(true);
  });

  it('never hands the same card back, so a card cannot be stuck on', () => {
    const { state } = walk(() => 'needs');
    const ids = state.placed.map((placement) => placement.itemId);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ═══════════════════════════════════════════
// 2. What a placement says
// ═══════════════════════════════════════════

describe('placeSortItem', () => {
  it('files a missed card into its own basket, not the tapped one', () => {
    const state = createSortingState();
    const item = currentSortItem(state);
    const wrong =
      BUDGET_DIRECTIONS.find((d) => d !== item?.direction) ?? 'needs';

    const outcome = placeSortItem(state, wrong);

    expect(outcome?.placement.chosen).toBe(wrong);
    expect(outcome?.placement.direction).toBe(item?.direction);
    expect(outcome?.placement.isCorrect).toBe(false);
  });

  it('names the rule on a miss and on a hit alike', () => {
    const state = createSortingState();
    const item = currentSortItem(state);

    for (const direction of BUDGET_DIRECTIONS) {
      expect(placeSortItem(state, direction)?.explanation).toBe(
        item?.explanation,
      );
    }
  });

  it('leaves the previous state untouched', () => {
    const state = createSortingState();
    const outcome = placeSortItem(state, 'needs');

    expect(state.placed).toHaveLength(0);
    expect(outcome?.state.placed).toHaveLength(1);
    expect(outcome?.state).not.toBe(state);
  });

  it('gives back null when there is no card left', () => {
    const { state } = walk(() => 'needs');

    expect(currentSortItem(state)).toBeNull();
    expect(placeSortItem(state, 'needs')).toBeNull();
  });
});

// ═══════════════════════════════════════════
// 3. Progress counts done cards, never time
// ═══════════════════════════════════════════

describe('sortingProgress', () => {
  it('starts at zero of the full deck', () => {
    expect(sortingProgress(createSortingState())).toEqual({
      done: 0,
      total: listSortItems().length,
    });
  });

  it('keeps the total steady while the done half grows', () => {
    const first = placeSortItem(createSortingState(), 'needs');
    const progress = sortingProgress(first?.state as SortingState);

    expect(progress).toEqual({ done: 1, total: listSortItems().length });
  });

  it('ends full', () => {
    const { state } = walk(() => 'wants');
    const { done, total } = sortingProgress(state);

    expect(done).toBe(total);
  });
});
