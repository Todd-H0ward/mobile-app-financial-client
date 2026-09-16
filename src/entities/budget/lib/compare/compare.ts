import { BUDGET_DIRECTIONS, BUDGET_TOLERANCE } from '@/entities/economy';

import type { BudgetComparison, BudgetFact, BudgetPlan } from '../../model';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Plan vs fact for every direction.
 *
 * Always three rows — even when both sides are zero. An empty summary screen
 * is not allowed, see docs/budget.md.
 */
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

/**
 * Whether a direction landed inside the named tolerance of its plan.
 * Underspend and overspend both miss — "on plan" is the exact match the
 * summary calls "уложился".
 */
export const isOnPlan = (row: BudgetComparison): boolean =>
  Math.abs(row.delta) <= BUDGET_TOLERANCE;
