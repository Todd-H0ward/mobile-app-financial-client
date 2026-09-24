import type { BudgetDirection } from '@/entities/economy';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** What the child set aside per direction. Coins, whole numbers, ≥ 0. */
interface BudgetPlan {
  /** Must-haves: food, the robot's charge. */
  needs: number;
  /** Nice-to-haves: toys, room decorations. */
  wants: number;
  /** Put away towards a financial goal. */
  savings: number;
}

/** What actually went out. Same shape, so comparing is a subtraction. */
type BudgetFact = BudgetPlan;

/** One comparison row — always present, even when plan and fact are zero. */
interface BudgetComparison {
  direction: BudgetDirection;
  /** What the child set aside for the period. */
  planned: number;
  /** What actually went out or into the jar. */
  actual: number;
  /** `actual − planned`. Negative means underspent. */
  delta: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** An empty plan: nothing set aside yet. Coins, whole numbers, ≥ 0. */
const EMPTY_PLAN: BudgetPlan = {
  needs: 0,
  wants: 0,
  savings: 0,
};

export type { BudgetComparison, BudgetFact, BudgetPlan };
export { EMPTY_PLAN };
