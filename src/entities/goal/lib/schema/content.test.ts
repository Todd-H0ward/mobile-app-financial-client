import { describe, expect, it } from 'vitest';

import { assertGoalsContent, getGoalById, listGoals } from '../..';

import GOALS_CONTENT from '@/content/goals.json';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

/** A fourth goal — proves 2.5.14: new content is a JSON row, not a code change. */
const FOURTH_GOAL = {
  id: 'bike',
  title: 'Велосипед',
  price: 400,
};

const withGoals = (goals: unknown[]) => ({ goals });

// ═══════════════════════════════════════════
// 1. The shipped content is valid
// ═══════════════════════════════════════════

describe('content/goals.json', () => {
  it('passes the schema', () => {
    expect(() => assertGoalsContent(GOALS_CONTENT)).not.toThrow();
  });

  it('carries at least three goals — 2.5.7', () => {
    expect(listGoals().length).toBeGreaterThanOrEqual(3);
  });

  it('has unique ids, and every one is findable', () => {
    const ids = listGoals().map((goal) => goal.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(getGoalById(id)?.id).toBe(id);
    }
  });

  it('prices climb, so the jar shows a near goal and a far one', () => {
    const prices = listGoals().map((goal) => goal.price);

    expect(Math.max(...prices)).toBeGreaterThan(Math.min(...prices));
  });

  it('accepts a new goal added as a plain JSON row', () => {
    expect(() =>
      assertGoalsContent(withGoals([...GOALS_CONTENT.goals, FOURTH_GOAL])),
    ).not.toThrow();
  });
});

// ═══════════════════════════════════════════
// 2. Broken content fails here, never on the device
// ═══════════════════════════════════════════

describe('assertGoalsContent', () => {
  const valid = GOALS_CONTENT.goals;

  it('rejects a goal without an id or a title', () => {
    expect(() =>
      assertGoalsContent(withGoals([...valid, { ...FOURTH_GOAL, id: '' }])),
    ).toThrow(/id/);
    expect(() =>
      assertGoalsContent(withGoals([...valid, { ...FOURTH_GOAL, title: 42 }])),
    ).toThrow(/title/);
  });

  it('rejects a price that is not a positive whole number of coins', () => {
    for (const price of [0, -10, 12.5, '60', null]) {
      expect(() =>
        assertGoalsContent(withGoals([...valid, { ...FOURTH_GOAL, price }])),
      ).toThrow(/price/);
    }
  });

  it('rejects a duplicate id — the save addresses goals by id alone', () => {
    expect(() => assertGoalsContent(withGoals([...valid, valid[0]]))).toThrow(
      /duplicate/,
    );
  });

  it('rejects a file with too few goals', () => {
    expect(() => assertGoalsContent(withGoals(valid.slice(0, 2)))).toThrow(
      /at least/,
    );
  });

  it('rejects anything that is not a goals file', () => {
    expect(() => assertGoalsContent(null)).toThrow();
    expect(() => assertGoalsContent({ goals: 'nope' })).toThrow();
    expect(() => assertGoalsContent(withGoals([...valid, 7]))).toThrow();
  });
});
