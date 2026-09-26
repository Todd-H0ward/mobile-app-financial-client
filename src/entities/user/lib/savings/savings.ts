import { getGoalById } from '@/entities/goal';
import { isLiquid, remainingFor } from '@/entities/savings';

import type { TimeSource } from '@/shared/lib/time-source';

import type { UserSave } from '../../model';
import { creditWallet, debitWallet } from '../wallet';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SavingsOk {
  ok: true;
  user: UserSave;
}

interface SavingsFail {
  ok: false;
  reason:
    | 'wrong_phase'
    | 'unknown_goal'
    | 'invalid_amount'
    | 'insufficient_funds'
    | 'insufficient_saved'
    | 'goal_complete'
    | 'non_liquid';
  shortfall?: number;
  price?: number;
  balance?: number;
}

type SavingsResult = SavingsOk | SavingsFail;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isPositiveInt = (amount: number): boolean =>
  Number.isFinite(amount) && amount > 0 && Number.isInteger(amount);

const withGoalSaved = (
  user: UserSave,
  goalId: string,
  saved: number,
  reachedInPeriod: number | null,
): UserSave['savings'] => ({
  ...user.savings,
  goals: user.savings.goals.map((row) =>
    row.goalId === goalId ? { ...row, saved, reachedInPeriod } : row,
  ),
});

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Moves coins from the wallet into one goal's jar.
 *
 * Debits the wallet, bumps `fact.savings`, increments `depositsThisPeriod`
 * (feeds the regularity bonus), and marks the goal reached when full — 2.5.7.
 */
export const applyDeposit = (
  user: UserSave,
  goalId: string,
  amount: number,
  time: TimeSource,
): SavingsResult => {
  if (user.period.phase !== 'active') {
    return { ok: false, reason: 'wrong_phase' };
  }
  if (!isPositiveInt(amount)) {
    return { ok: false, reason: 'invalid_amount' };
  }

  const goal = getGoalById(goalId);
  const row = user.savings.goals.find((entry) => entry.goalId === goalId);
  if (!goal || !row) {
    return { ok: false, reason: 'unknown_goal' };
  }

  const room = remainingFor(row.saved, goal.price);
  if (room <= 0) {
    return { ok: false, reason: 'goal_complete' };
  }
  if (amount > room) {
    return { ok: false, reason: 'invalid_amount' };
  }

  const debit = debitWallet(user.wallet, {
    source: `savings:deposit:${goalId}`,
    amount,
    direction: 'savings',
    periodIndex: user.period.index,
    at: time.now(),
  });

  if (!debit.ok) {
    return {
      ok: false,
      reason: 'insufficient_funds',
      shortfall: debit.shortfall,
      price: debit.price,
      balance: debit.balance,
    };
  }

  const saved = row.saved + amount;
  const reachedInPeriod =
    saved >= goal.price ? (row.reachedInPeriod ?? user.period.index) : null;

  return {
    ok: true,
    user: {
      ...user,
      wallet: debit.wallet,
      savings: {
        ...withGoalSaved(user, goalId, saved, reachedInPeriod),
        depositsThisPeriod: user.savings.depositsThisPeriod + 1,
      },
      period: {
        ...user.period,
        fact: {
          ...user.period.fact,
          savings: user.period.fact.savings + amount,
        },
      },
    },
  };
};

/**
 * Moves coins from one goal's jar back to the wallet.
 *
 * Always call after the child confirms the consequence sheet — 2.5.7 forbids
 * a silent take. Lowers `fact.savings` and clears `reachedInPeriod` if the
 * jar drops below the price again.
 */
export const applyWithdraw = (
  user: UserSave,
  goalId: string,
  amount: number,
  time: TimeSource,
): SavingsResult => {
  if (!isLiquid(goalId)) {
    return { ok: false, reason: 'non_liquid' };
  }
  if (user.period.phase !== 'active') {
    return { ok: false, reason: 'wrong_phase' };
  }
  if (!isPositiveInt(amount)) {
    return { ok: false, reason: 'invalid_amount' };
  }

  const goal = getGoalById(goalId);
  const row = user.savings.goals.find((entry) => entry.goalId === goalId);
  if (!goal || !row) {
    return { ok: false, reason: 'unknown_goal' };
  }
  if (amount > row.saved) {
    return { ok: false, reason: 'insufficient_saved' };
  }

  const wallet = creditWallet(user.wallet, {
    source: `savings:withdraw:${goalId}`,
    amount,
    direction: null,
    periodIndex: user.period.index,
    at: time.now(),
  });

  const saved = row.saved - amount;
  const reachedInPeriod = saved >= goal.price ? row.reachedInPeriod : null;

  return {
    ok: true,
    user: {
      ...user,
      wallet,
      savings: withGoalSaved(user, goalId, saved, reachedInPeriod),
      period: {
        ...user.period,
        fact: {
          ...user.period.fact,
          savings: Math.max(0, user.period.fact.savings - amount),
        },
      },
    },
  };
};

/**
 * Picks which goal the home HUD and the jar focus on.
 */
export const setActiveGoal = (
  user: UserSave,
  goalId: string,
): SavingsResult => {
  if (!user.savings.goals.some((row) => row.goalId === goalId)) {
    return { ok: false, reason: 'unknown_goal' };
  }

  return {
    ok: true,
    user: {
      ...user,
      savings: {
        ...user.savings,
        activeGoalId: goalId,
      },
    },
  };
};

export type { SavingsFail, SavingsOk, SavingsResult };
