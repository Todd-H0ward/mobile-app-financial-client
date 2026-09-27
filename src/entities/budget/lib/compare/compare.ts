import { BUDGET_DIRECTIONS, BUDGET_TOLERANCE } from '@/entities/economy';

import type { BudgetComparison, BudgetFact, BudgetPlan } from '../../model';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Plan vs fact for every direction. */
export const compare = (
  plan: BudgetPlan,
  fact: BudgetFact,
): BudgetComparison[] =>
  BUDGET_DIRECTIONS.map((direction) => ({
    direction,
    planned: plan[direction],
    actual: fact[direction],
    delta: fact[direction] - plan[direction],
  }));

export const isOnPlan = (row: BudgetComparison): boolean =>
  Math.abs(row.delta) <= BUDGET_TOLERANCE;
