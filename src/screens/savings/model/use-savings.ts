import { listGoals } from '@/entities/goal';
import { progressFor, remainingFor } from '@/entities/savings';
import { setActiveGoal, useUpdateUser, useUser } from '@/entities/user';

import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SavingsGoalRow {
  id: string;
  /** Catalogue title (i18n overlays in the UI). */
  title: string;
  price: number;
  saved: number;
  remaining: number;
  /** 0…1 for the progress bar. */
  progress: number;
  /** "32 из 120". */
  progressLabel: string;
  isActive: boolean;
  isReached: boolean;
}

interface SavingsController {
  balance: number;
  /** Sum across every goal jar. */
  totalSaved: number;
  goals: SavingsGoalRow[];
  setActive: (goalId: string) => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Showcase of every savings goal with progress — 2.5.7. */
export const useSavings = (): SavingsController => {
  const user = useUser();
  const updateUser = useUpdateUser();

  const balance = user?.wallet.balance ?? 0;
  const totalSaved =
    user?.savings.goals.reduce((sum, row) => sum + row.saved, 0) ?? 0;

  const goals: SavingsGoalRow[] = listGoals().map((goal) => {
    const row = user?.savings.goals.find((entry) => entry.goalId === goal.id);
    const saved = row?.saved ?? 0;
    return {
      id: goal.id,
      title: goal.title,
      price: goal.price,
      saved,
      remaining: remainingFor(saved, goal.price),
      progress: progressFor(saved, goal.price),
      progressLabel: `${formatMoney(saved)} / ${formatMoney(goal.price)}`,
      isActive: user?.savings.activeGoalId === goal.id,
      isReached: row?.reachedInPeriod != null || saved >= goal.price,
    };
  });

  return {
    balance,
    totalSaved,
    goals,
    setActive: (goalId) => {
      if (!user) return;
      const result = setActiveGoal(user, goalId);
      if (result.ok) updateUser(() => result.user);
    },
  };
};

export type { SavingsController, SavingsGoalRow };
