import { useMemo } from 'react';

import { useShowFeedback } from '@/features/feedback';

import { getGoalById } from '@/entities/goal';
import { explainWithdraw, type WithdrawExplain } from '@/entities/savings';
import { applyWithdraw, useCommitUser, useUser } from '@/entities/user';

import { useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WithdrawController {
  goalId: string;
  title: string;
  amount: number;
  /** Recalculated consequences for the confirm screen. */
  explain: WithdrawExplain;
  /** False when amount is illegal or the period is not active. */
  canConfirm: boolean;
  confirm: () => boolean;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Withdraw confirm controller — recalculates consequences, never mutates until
 * `confirm` (2.5.7 / roadmap 1.15).
 */
export const useWithdraw = (
  goalId: string,
  amount: number,
): WithdrawController | null => {
  const user = useUser();
  const commitUser = useCommitUser();
  const time = useTimeSource();
  const showFeedback = useShowFeedback();

  const goal = getGoalById(goalId);
  const row = user?.savings.goals.find((entry) => entry.goalId === goalId);
  const saved = row?.saved ?? 0;

  const explain = useMemo(() => {
    if (!goal) return null;
    return explainWithdraw({
      amount,
      saved,
      price: goal.price,
      goalTitle: goal.title,
      plannedDeposit: user?.period.plan.savings ?? 0,
    });
  }, [goal, amount, saved, user?.period.plan.savings]);

  if (!user || !goal || !row || !explain) return null;

  const canConfirm =
    user.period.phase === 'active' &&
    Number.isInteger(amount) &&
    amount > 0 &&
    amount <= saved;

  return {
    goalId,
    title: goal.title,
    amount,
    explain,
    canConfirm,

    confirm: () => {
      if (!canConfirm) return false;
      const result = applyWithdraw(user, goalId, amount, time);
      if (!result.ok || !commitUser(user, result.user)) return false;
      showFeedback({
        before: user,
        after: result.user,
        action: 'withdraw',
        params: { goal: goal.title, amount },
      });
      return true;
    },
  };
};

export type { WithdrawController };
