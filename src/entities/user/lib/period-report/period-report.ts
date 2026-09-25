import type { BudgetFact, BudgetPlan } from '@/entities/budget';
import { WALLET_SOURCES } from '@/entities/economy';

import type { UserSave, WalletEntry } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Fraction of liquid balance lost when the budget is not met.
 *
 * 10 % — felt enough to teach cause and effect, small enough not to trap a
 * child who already has nothing. The penalty never drops the wallet below
 * zero, and it never touches non-liquid savings or the platform level.
 */
export const BUDGET_FAIL_PENALTY_RATE = 0.1;

/**
 * Bonus coins awarded when the budget is met for the period.
 *
 * Small enough that it does not distort the economy, big enough to be
 * noticeable on the summary screen.
 */
export const BUDGET_SUCCESS_BONUS = 5;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Detailed financial breakdown for the period that just ended. */
interface PeriodReport {
  /** Period number for display. */
  periodIndex: number;
  /** Total coins earned during the period (tasks, games, bonuses). */
  earned: number;
  /** Coins spent on charge / needs. */
  spentOnCharge: number;
  /** Coins spent on modules and cosmetics / wants. */
  spentOnModules: number;
  /** Coins deposited into savings goals. */
  savedAmount: number;
  /** The plan the period started with. */
  plan: BudgetPlan;
  /** The fact the period ended with. */
  fact: BudgetFact;
  /** Budget matched — no direction overspent. */
  isBudgetMet: boolean;
  /** Bonus (positive) or penalty (negative) applied at settlement. */
  adjustment: number;
  /** Platform level after this period. */
  level: number;
  /** Robot charge after settlement decay. */
  robotCharge: number;
  /** Robot spirit after settlement decay. */
  robotSpirit: number;
  /** Robot mood name for display. */
  robotMood: string;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Sums up earnings during a specific period from wallet history.
 *
 * Skips the starting-wallet credit — that is not "earned this period".
 */
const sumEarnings = (history: WalletEntry[], periodIndex: number): number =>
  history
    .filter(
      (entry) =>
        entry.kind === 'earn' &&
        entry.periodIndex === periodIndex &&
        entry.source !== WALLET_SOURCES.startingWallet,
    )
    .reduce((total, entry) => total + entry.amount, 0);

/**
 * Computes the penalty or bonus based on whether the budget was met.
 *
 * - Met: flat bonus of `BUDGET_SUCCESS_BONUS`.
 * - Not met: penalty of `BUDGET_FAIL_PENALTY_RATE` × balance, floored.
 *
 * The penalty never exceeds the current balance.
 */
export const computeAdjustment = (
  isBudgetMet: boolean,
  balance: number,
): number => {
  if (isBudgetMet) return BUDGET_SUCCESS_BONUS;
  const penalty = Math.floor(balance * BUDGET_FAIL_PENALTY_RATE);
  return penalty === 0 ? 0 : -penalty;
};

// ═══════════════════════════════════════════
// BUILDER
// ═══════════════════════════════════════════

/**
 * Builds a full period report from the user save at `summary` phase.
 *
 * Called before `endPeriod` settles the state — the report reads the
 * pre-settlement snapshot so plan, fact and balance are still frozen.
 */
export const buildPeriodReport = (user: UserSave): PeriodReport => {
  const { period, wallet, robot, platform } = user;

  const isBudgetMet = (['needs', 'wants', 'savings'] as const).every(
    (direction) => period.fact[direction] <= period.plan[direction],
  );

  const earned = sumEarnings(wallet.history, period.index);
  const adjustment = computeAdjustment(isBudgetMet, wallet.balance);

  return {
    periodIndex: period.index,
    earned,
    spentOnCharge: period.fact.needs,
    spentOnModules: period.fact.wants,
    savedAmount: period.fact.savings,
    plan: period.plan,
    fact: period.fact,
    isBudgetMet,
    adjustment,
    level: platform.level,
    robotCharge: robot.charge,
    robotSpirit: robot.spirit,
    robotMood:
      robot.charge < 0.3 ? 'tired' : robot.spirit < 0.3 ? 'sad' : 'content',
  };
};

export type { PeriodReport };
