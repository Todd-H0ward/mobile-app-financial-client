import type { GoalContent } from '../../model';
import { assertGoalsContent } from '../schema';

import GOALS_CONTENT from '@/content/goals.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const GOALS = assertGoalsContent(GOALS_CONTENT).goals;

/** Every goal from `content/goals.json`, in file order. */
export const listGoals = (): readonly GoalContent[] => GOALS;

/** Look up one goal by id. `undefined` if the content has no such row. */
export const getGoalById = (id: string): GoalContent | undefined =>
  GOALS.find((goal) => goal.id === id);
