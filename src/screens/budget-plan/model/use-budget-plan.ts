import { useState } from 'react';

import { useRouter } from 'expo-router';

import { useShowFeedback } from '@/features/feedback';

import {
  addCoin,
  allocate,
  type BudgetPlan,
  canConfirm,
  EMPTY_PLAN,
  remainder,
  removeCoin,
} from '@/entities/budget';
import type { BudgetDirection } from '@/entities/economy';
import { startPeriod, useUpdateUser, useUser } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';
import { hapticSuccess } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface BudgetPlanController {
  /** Wallet balance at planning time — the ceiling for the plan. */
  available: number;
  plan: BudgetPlan;
  /** Coins not laid out yet. Leaving some is allowed. */
  planLeft: number;
  canConfirm: boolean;
  /** True when needs is still zero — confirmation asks before starting. */
  isNeedsEmpty: boolean;
  isNeedsWarningVisible: boolean;
  /** True when the wallet is empty — confirm opens the day to earn. */
  isBroke: boolean;
  setDirection: (direction: BudgetDirection, value: number) => void;
  addCoin: (direction: BudgetDirection) => void;
  removeCoin: (direction: BudgetDirection) => void;
  requestConfirm: () => void;
  dismissNeedsWarning: () => void;
  confirmDespiteNeeds: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Draft plan for the current period.
 *
 * The draft lives in local state until confirm — spending is locked behind
 * `startPeriod`, so a half-finished draft never reaches the wallet. Seeded
 * from the save so a re-opened screen still shows what was written last.
 */
export const useBudgetPlan = (): BudgetPlanController => {
  const router = useRouter();
  const user = useUser();
  const updateUser = useUpdateUser();
  const showFeedback = useShowFeedback();

  const available = user?.wallet.balance ?? 0;
  const savedPlan = user?.period.plan ?? EMPTY_PLAN;

  const [plan, setPlan] = useState<BudgetPlan>(savedPlan);
  const [isNeedsWarningVisible, setIsNeedsWarningVisible] = useState(false);

  const planLeft = remainder(available, plan);

  const commit = (next: BudgetPlan) => {
    if (!user) return;

    const drafted = {
      ...user,
      period: { ...user.period, plan: next },
    };
    const after = startPeriod(drafted);

    hapticSuccess();
    showFeedback({
      before: user,
      after,
      action: 'plan',
      params: {
        needs: next.needs,
        wants: next.wants,
        savings: next.savings,
      },
    });

    updateUser(() => after);
    setIsNeedsWarningVisible(false);
    router.replace(STATIC_ROUTES.HOME);
  };

  return {
    available,
    plan,
    planLeft,
    canConfirm: canConfirm(plan, available),
    isNeedsEmpty: plan.needs === 0,
    isNeedsWarningVisible,
    /** Wallet is empty — confirm starts the day so chores can pay. */
    isBroke: available === 0,

    setDirection: (direction, value) => {
      setPlan((current) => allocate(current, direction, value, available));
    },

    addCoin: (direction) => {
      setPlan((current) => addCoin(current, direction, available));
    },

    removeCoin: (direction) => {
      setPlan((current) => removeCoin(current, direction, available));
    },

    requestConfirm: () => {
      if (!canConfirm(plan, available)) return;

      // Nothing to allocate — skip the needs warning and open the day so
      // the child can earn on chores (period-2 softlock otherwise).
      if (available === 0) {
        commit(plan);
        return;
      }

      if (plan.needs === 0) {
        setIsNeedsWarningVisible(true);
        return;
      }

      commit(plan);
    },

    dismissNeedsWarning: () => setIsNeedsWarningVisible(false),

    confirmDespiteNeeds: () => {
      if (!canConfirm(plan, available)) return;
      commit(plan);
    },
  };
};

export type { BudgetPlanController };
