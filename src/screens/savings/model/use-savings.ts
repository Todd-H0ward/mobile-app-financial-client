import { listGoals } from '@/entities/goal';
import { progressFor, remainingFor } from '@/entities/savings';
import { setActiveGoal, useCommitUser, useUser } from '@/entities/user';

import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SavingsGoalRow {
  id: string;
  title: string;
  price: number;
  saved: number;
  remaining: number;
  /** 0…1 for the progress bar. */
  progress: number;
  progressLabel: string;
  isActive: boolean;
  isReached: boolean;
}

interface SavingsController {
  balance: number;
  totalSaved: number;
  goals: SavingsGoalRow[];
  setActive: (goalId: string) => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

export const useSavings = (): SavingsController => {
  const user = useUser();
  const commitUser = useCommitUser();

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
      if (result.ok) commitUser(user, result.user);
    },
  };
};

export type { SavingsController, SavingsGoalRow };
