import { periodsEstimateFor, progressFor, remainingFor } from '../progress';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WithdrawExplainInput {
  amount: number;
  saved: number;
  /** Goal price from content. */
  price: number;
  /** Goal title — for the confirm screen, already chosen language. */
  goalTitle: string;
  /**
   * Planned deposit per period (`plan.savings`). Used only for the rough
   * "примерно N периодов" line — never for the wallet math.
   */
  plannedDeposit: number;
}

/**
 * Consequence of a withdrawal — shown on the confirm screen before coins move
 * (2.5.7 / roadmap 1.15).
 *
 * Naming the cost of the decision is the requirement; blocking it is not.
 */
interface WithdrawExplain {
  amount: number;
  goalTitle: string;
  /** Jar balance before the take. */
  savedBefore: number;
  /** Jar balance after the take. */
  savedAfter: number;
  /** Goal price − saved, before the take. */
  remainingBefore: number;
  /** Goal price − (saved − amount), after the take. */
  remainingAfter: number;
  /** 0…1 progress before the take. */
  progressBefore: number;
  /** 0…1 progress after the take. */
  progressAfter: number;
  /** Rough periods to the goal before the take, or null when unknown. */
  periodsBefore: number | null;
  /** Rough periods to the goal after the take, or null when unknown. */
  periodsAfter: number | null;
  /** Goal price — for progress captions. */
  price: number;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Recalculates every consequence number for the withdraw confirm screen.
 *
 * Pure: no wallet mutation. The screen shows remaining before/after and a
 * soft period estimate — docs/economy.md.
 */
export const explainWithdraw = (
  input: WithdrawExplainInput,
): WithdrawExplain => {
  const amount = Math.max(0, input.amount);
  const savedBefore = Math.max(0, input.saved);
  const savedAfter = Math.max(0, savedBefore - amount);
  const remainingBefore = remainingFor(savedBefore, input.price);
  const remainingAfter = remainingFor(savedAfter, input.price);

  return {
    amount,
    goalTitle: input.goalTitle,
    savedBefore,
    savedAfter,
    remainingBefore,
    remainingAfter,
    progressBefore: progressFor(savedBefore, input.price),
    progressAfter: progressFor(savedAfter, input.price),
    periodsBefore: periodsEstimateFor(remainingBefore, input.plannedDeposit),
    periodsAfter: periodsEstimateFor(remainingAfter, input.plannedDeposit),
    price: input.price,
  };
};

export type { WithdrawExplain, WithdrawExplainInput };
