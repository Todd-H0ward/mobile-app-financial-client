import { BUDGET_DIRECTIONS, type BudgetDirection } from '@/entities/economy';

import { clamp } from '@/shared/utils';

import { type BudgetPlan, EMPTY_PLAN } from '../../model';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Coins already laid out across every direction. */
export const planSum = (plan: BudgetPlan): number =>
  BUDGET_DIRECTIONS.reduce((total, direction) => total + plan[direction], 0);

/**
 * Coins not yet assigned. Leaving some is allowed — the task is not to spend
 * everything, see docs/budget.md.
 */
export const remainder = (available: number, plan: BudgetPlan): number =>
  available - planSum(plan);

/**
 * Puts an exact amount into one direction without letting the plan exceed
 * `available`. The slider "hits the wall" at the remainder — the child never
 * learns about the overspend after confirming.
 */
export const allocate = (
  plan: BudgetPlan,
  direction: BudgetDirection,
  value: number,
  available: number,
): BudgetPlan => {
  const others = planSum(plan) - plan[direction];
  const maxForDirection = Math.max(0, available - others);
  // Whole coins only: the wallet never holds fractions.
  const whole = Number.isFinite(value) ? Math.round(value) : 0;
  const next = clamp(whole, 0, maxForDirection);

  if (next === plan[direction]) return plan;

  return { ...plan, [direction]: next };
};

/** Lays one coin into a direction. No-op when nothing is left. */
export const addCoin = (
  plan: BudgetPlan,
  direction: BudgetDirection,
  available: number,
): BudgetPlan => allocate(plan, direction, plan[direction] + 1, available);

/** Takes one coin back. No-op when that direction is empty. */
export const removeCoin = (
  plan: BudgetPlan,
  direction: BudgetDirection,
  available: number,
): BudgetPlan => allocate(plan, direction, plan[direction] - 1, available);

/** Directions that still hold zero — allowed, but confirmation may warn. */
export const zeroDirections = (plan: BudgetPlan): BudgetDirection[] =>
  BUDGET_DIRECTIONS.filter((direction) => plan[direction] === 0);

/**
 * Whether the plan can start a period. Matches the guard on `startPeriod`:
 * at least one direction must hold something — unless the wallet is empty,
 * in which case an empty plan is the only way into `active` to earn on chores
 * (otherwise period 2 softlocks after a spent-down day).
 */
export const canConfirm = (
  plan: BudgetPlan,
  available = Number.POSITIVE_INFINITY,
): boolean =>
  isValidPlan(plan, available) &&
  (BUDGET_DIRECTIONS.some((direction) => plan[direction] > 0) ||
    available === 0);

/**
 * Shape and remainder check. Screens use `allocate` so this should always
 * hold for anything that reached the UI — the test suite pins the property.
 */
export const isValidPlan = (plan: BudgetPlan, available: number): boolean =>
  BUDGET_DIRECTIONS.every(
    (direction) => Number.isInteger(plan[direction]) && plan[direction] >= 0,
  ) && remainder(available, plan) >= 0;

export { EMPTY_PLAN };
