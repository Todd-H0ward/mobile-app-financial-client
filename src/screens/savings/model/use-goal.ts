import { useState } from 'react';

import { useRouter } from 'expo-router';

import { useShowFeedback } from '@/features/feedback';

import { PLATFORM_GOAL_ID, PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import { getGoalById } from '@/entities/goal';
import { isLiquid, progressFor, remainingFor } from '@/entities/savings';
import {
  applyDeposit,
  applyPlatformUpgrade,
  hasSeenStory,
  setActiveGoal,
  useCommitUser,
  useUser,
} from '@/entities/user';

import { DYNAMIC_ROUTES, STATIC_ROUTES } from '@/shared/constants';
import { useTimeSource } from '@/shared/lib';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type GoalSheet = 'planning' | 'lift' | null;

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
  /**
   * Lift jar is full enough to pay the next tier — only for `PLATFORM_GOAL_ID`.
   */
  canLift: boolean;
  /** Next platform level the jar would buy, or `null`. */
  nextTier: number | null;
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
  requestWithdraw: () => void;
  requestLift: () => void;
  confirmLift: () => void;
  dismissSheet: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * One goal's jar — deposit here; withdraw goes to its own confirm screen.
 * The lift jar also pays the next platform tier after a confirm.
 */
export const useGoal = (goalId: string): GoalController | null => {
  const user = useUser();
  const commitUser = useCommitUser();
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
  // Lift jar is non-liquid — coins stay until spent on a tier.
  const maxWithdraw = isLiquid(goalId) ? saved : 0;
  const canTransfer = user?.period.phase === 'active';
  const nextTier = user ? user.platform.level + 1 : null;
  const canLift =
    goalId === PLATFORM_GOAL_ID &&
    Boolean(canTransfer) &&
    Boolean(goal) &&
    saved >= (goal?.price ?? Number.POSITIVE_INFINITY) &&
    nextTier !== null &&
    nextTier <= PLATFORM_LEVEL_COUNT;

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
    canLift,
    nextTier,
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
      if (result.ok) commitUser(user, result.user);
    },

    deposit: () => {
      if (!canTransfer) {
        setSheet('planning');
        return;
      }
      if (amount <= 0 || amount > maxDeposit) return;
      const result = applyDeposit(user, goalId, amount, time);
      if (result.ok && commitUser(user, result.user)) {
        showFeedback({
          before: user,
          after: result.user,
          action: 'deposit',
          params: { goal: goal.title, amount },
        });
        setAmount(0);
      }
    },

    requestWithdraw: () => {
      if (!canTransfer) {
        setSheet('planning');
        return;
      }
      if (amount <= 0 || amount > maxWithdraw) return;
      router.push(DYNAMIC_ROUTES.withdraw(goalId, amount));
    },

    requestLift: () => {
      if (!canLift) return;
      setSheet('lift');
    },

    confirmLift: () => {
      if (nextTier === null) return;
      const result = applyPlatformUpgrade(user, nextTier, time);
      if (!result.ok) {
        setSheet(null);
        return;
      }
      if (commitUser(user, result.user)) {
        setSheet(null);
        const climbedOut =
          result.user.platform.level >= PLATFORM_LEVEL_COUNT &&
          !hasSeenStory(result.user, 'finale');
        router.replace(
          climbedOut ? DYNAMIC_ROUTES.story('finale') : STATIC_ROUTES.HOME,
        );
      }
    },

    dismissSheet: () => setSheet(null),
  };
};

export type { GoalController, GoalSheet };
