import type { GoalContent } from '../../model';
import { assertGoalsContent } from '../schema';

import GOALS_CONTENT from '@/content/goals.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const GOALS = assertGoalsContent(GOALS_CONTENT).goals;

export const listGoals = (): readonly GoalContent[] => GOALS;

export const getGoalById = (id: string): GoalContent | undefined =>
  GOALS.find((goal) => goal.id === id);
