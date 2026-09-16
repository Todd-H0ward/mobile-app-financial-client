import { periodsEstimateFor, remainingFor } from '../progress';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WithdrawExplainInput {
  /** Coins the child wants to take out. */
  amount: number;
  /** Coins already in the jar for this goal. */
  saved: number;
  /** Goal price from content. */
  price: number;
  /** Goal title — for the confirm sheet, already chosen language. */
  goalTitle: string;
  /**
   * Planned deposit per period (`plan.savings`). Used only for the rough
   * "примерно N периодов" line — never for the wallet math.
   */
  plannedDeposit: number;
}

/**
 * Consequence of a withdrawal — shown before the coins move (2.5.7).
 *
 * Naming the cost of the decision is the requirement; blocking it is not.
 */
interface WithdrawExplain {
  amount: number;
  goalTitle: string;
  /** Goal price − saved, before the take. */
  remainingBefore: number;
  /** Goal price − (saved − amount), after the take. */
  remainingAfter: number;
  /** Rough periods to the goal after the take, or null when unknown. */
  periodsAfter: number | null;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Builds the withdrawal confirm copy numbers — remaining before/after and a
 * soft period estimate. Pure: no wallet mutation.
 */
export const explainWithdraw = (
  input: WithdrawExplainInput,
): WithdrawExplain => {
  const amount = Math.max(0, input.amount);
  const remainingBefore = remainingFor(input.saved, input.price);
  const remainingAfter = remainingFor(input.saved - amount, input.price);

  return {
    amount,
    goalTitle: input.goalTitle,
    remainingBefore,
    remainingAfter,
    periodsAfter: periodsEstimateFor(remainingAfter, input.plannedDeposit),
  };
};

export type { WithdrawExplain, WithdrawExplainInput };
