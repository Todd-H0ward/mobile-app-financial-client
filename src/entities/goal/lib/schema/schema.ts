import { isNonEmptyString, isRecord } from '@/shared/utils';

import type { GoalContent, GoalsFile } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** 2.5.7: the jar is only a choice when there is more than one thing to save for. */
const MIN_GOALS = 3;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const assertGoal = (goal: unknown, path: string): GoalContent => {
  if (!isRecord(goal)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(goal.id)) {
    throw new Error(`${path}.id: non-empty string required`);
  }
  if (!isNonEmptyString(goal.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (
    typeof goal.price !== 'number' ||
    !Number.isInteger(goal.price) ||
    goal.price <= 0
  ) {
    throw new Error(`${path}.price: positive integer required`);
  }
  if (goal.note !== undefined && !isNonEmptyString(goal.note)) {
    throw new Error(`${path}.note: non-empty string when present`);
  }

  return goal as unknown as GoalContent;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/goals.json` (or a fixture shaped like it).
 *
 * Every goal ends up in the starting save, so a broken row here is a broken
 * profile on the device. It must fail in tests instead — 2.5.14 / 3.2.
 */
export const assertGoalsContent = (data: unknown): GoalsFile => {
  if (!isRecord(data)) {
    throw new Error('goals content: must be an object');
  }
  if (!Array.isArray(data.goals)) {
    throw new Error('goals content: "goals" must be an array');
  }
  if (data.goals.length < MIN_GOALS) {
    throw new Error(`goals content: need at least ${MIN_GOALS} goals — 2.5.7`);
  }

  const ids = new Set<string>();

  const goals = data.goals.map((goal, index) => {
    const parsed = assertGoal(goal, `goals[${index}]`);
    if (ids.has(parsed.id)) {
      throw new Error(`goals: duplicate id "${parsed.id}"`);
    }
    ids.add(parsed.id);

    return parsed;
  });

  return { goals };
};
