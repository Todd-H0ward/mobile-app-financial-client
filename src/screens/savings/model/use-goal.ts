import { useState } from 'react';

import { useRouter } from 'expo-router';

import { useShowFeedback } from '@/features/feedback';

import { getGoalById } from '@/entities/goal';
import { progressFor, remainingFor } from '@/entities/savings';
import {
  applyDeposit,
  setActiveGoal,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { withdrawPath } from '@/shared/constants';
import { useTimeSource } from '@/shared/lib';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type GoalSheet = 'planning' | null;

interface GoalController {
  goalId: string;
  title: string;
  price: number;
  saved: number;
  remaining: number;
  progress: number;
  progressLabel: string;
  isActive: boolean;
  isReached: boolean;
  /** Wallet balance — ceiling for a deposit. */
  balance: number;
  /** True only while the period is `active`. */
  canTransfer: boolean;
  /** Coins staged for deposit or withdraw. */
  amount: number;
  maxDeposit: number;
  maxWithdraw: number;
  sheet: GoalSheet;
  setAmount: (value: number) => void;
  addCoin: () => void;
  removeCoin: () => void;
  setMaxDeposit: () => void;
  setMaxWithdraw: () => void;
  makeActive: () => void;
  deposit: () => void;
  /** Opens the dedicated withdraw confirm screen (1.15). */
  requestWithdraw: () => void;
  dismissSheet: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * One goal's jar — deposit here; withdraw goes to its own confirm screen.
 */
export const useGoal = (goalId: string): GoalController | null => {
  const user = useUser();
  const updateUser = useUpdateUser();
  const time = useTimeSource();
  const router = useRouter();
  const showFeedback = useShowFeedback();

  const goal = getGoalById(goalId);
  const row = user?.savings.goals.find((entry) => entry.goalId === goalId);

  const [amount, setAmount] = useState(0);
  const [sheet, setSheet] = useState<GoalSheet>(null);

  const saved = row?.saved ?? 0;
  const balance = user?.wallet.balance ?? 0;
  const remaining = goal ? remainingFor(saved, goal.price) : 0;
  const maxDeposit = Math.min(balance, remaining);
  const maxWithdraw = saved;
  const canTransfer = user?.period.phase === 'active';

  if (!goal || !user || !row) return null;

  const clampAmount = (value: number, max: number) =>
    Math.max(0, Math.min(max, Math.floor(value)));

  return {
    goalId,
    title: goal.title,
    price: goal.price,
    saved,
    remaining,
    progress: progressFor(saved, goal.price),
    progressLabel: `${formatMoney(saved)} / ${formatMoney(goal.price)}`,
    isActive: user.savings.activeGoalId === goalId,
    isReached: row.reachedInPeriod != null || saved >= goal.price,
    balance,
    canTransfer: Boolean(canTransfer),
    amount,
    maxDeposit,
    maxWithdraw,
    sheet,

    setAmount: (value) =>
      setAmount(clampAmount(value, Math.max(maxDeposit, maxWithdraw))),
    addCoin: () =>
      setAmount((current) =>
        clampAmount(current + 1, Math.max(maxDeposit, maxWithdraw)),
      ),
    removeCoin: () => setAmount((current) => Math.max(0, current - 1)),
    setMaxDeposit: () => setAmount(maxDeposit),
    setMaxWithdraw: () => setAmount(maxWithdraw),

    makeActive: () => {
      const result = setActiveGoal(user, goalId);
      if (result.ok) updateUser(() => result.user);
    },

    deposit: () => {
      if (!canTransfer) {
        setSheet('planning');
        return;
      }
      if (amount <= 0 || amount > maxDeposit) return;
      const result = applyDeposit(user, goalId, amount, time);
      if (result.ok) {
        showFeedback({
          before: user,
          after: result.user,
          action: 'deposit',
          params: { goal: goal.title, amount },
        });
        updateUser(() => result.user);
        setAmount(0);
      }
    },

    requestWithdraw: () => {
      if (!canTransfer) {
        setSheet('planning');
        return;
      }
      if (amount <= 0 || amount > maxWithdraw) return;
      router.push(withdrawPath(goalId, amount));
    },

    dismissSheet: () => setSheet(null),
  };
};

export type { GoalController, GoalSheet };
