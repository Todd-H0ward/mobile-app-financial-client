import { useState } from 'react';

import { useRouter } from 'expo-router';

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

import { ROUTES } from '@/shared/constants';
import { useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Everything the budget-plan screen reads and calls. */
interface BudgetPlanController {
  /** Wallet balance at planning time — the ceiling for the plan. */
  available: number;
  /** Draft plan, coins per direction. */
  plan: BudgetPlan;
  /** Coins not laid out yet. Leaving some is allowed. */
  planLeft: number;
  /** Whether the confirm button is live. */
  canConfirm: boolean;
  /** True when needs is still zero — confirmation asks before starting. */
  isNeedsEmpty: boolean;
  /** Whether the needs-zero warning sheet is open. */
  isNeedsWarningVisible: boolean;
  /** Sets one direction via the slider. */
  setDirection: (direction: BudgetDirection, value: number) => void;
  /** Lays one coin into a direction. */
  addCoin: (direction: BudgetDirection) => void;
  /** Takes one coin back. */
  removeCoin: (direction: BudgetDirection) => void;
  /** Opens the needs warning when needed, otherwise starts the period. */
  requestConfirm: () => void;
  /** Closes the needs warning without starting. */
  dismissNeedsWarning: () => void;
  /** Starts the period despite needs being zero. */
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
  const time = useTimeSource();
  const user = useUser();
  const updateUser = useUpdateUser();

  const available = user?.wallet.balance ?? 0;
  const savedPlan = user?.period.plan ?? EMPTY_PLAN;

  const [plan, setPlan] = useState<BudgetPlan>(savedPlan);
  const [isNeedsWarningVisible, setIsNeedsWarningVisible] = useState(false);

  const planLeft = remainder(available, plan);

  const commit = (next: BudgetPlan) => {
    updateUser((current) =>
      startPeriod(
        {
          ...current,
          period: { ...current.period, plan: next },
        },
        time,
      ),
    );
    setIsNeedsWarningVisible(false);
    router.replace(ROUTES.HOME);
  };

  return {
    available,
    plan,
    planLeft,
    canConfirm: canConfirm(plan),
    isNeedsEmpty: plan.needs === 0,
    isNeedsWarningVisible,

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
      if (!canConfirm(plan)) return;

      if (plan.needs === 0) {
        setIsNeedsWarningVisible(true);
        return;
      }

      commit(plan);
    },

    dismissNeedsWarning: () => setIsNeedsWarningVisible(false),

    confirmDespiteNeeds: () => {
      if (!canConfirm(plan)) return;
      commit(plan);
    },
  };
};

export type { BudgetPlanController };
