import { useRouter } from 'expo-router';

import {
  type BudgetComparison,
  compare,
  explainSummary,
  type SummaryExplain,
} from '@/entities/budget';
import { getGoalById } from '@/entities/goal';
import { buildPeriodReport, type PeriodReport, useUser } from '@/entities/user';
import {
  KEEPER_LINES,
  pickLine,
  type WatcherGameState,
  type WatcherLine,
} from '@/entities/watcher';

import { STATIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GoalStatus {
  goalId: string;
  title: string;
  saved: number;
  price: number;
  isReached: boolean;
}

interface PeriodSummaryController {
  periodIndex: number;
  /** Three comparison rows, always. */
  rows: BudgetComparison[];
  /** Story for the copy layer — tips live on the recovery screen. */
  explain: SummaryExplain;
  /** Largest of plan/fact across rows — shared scale for the bars. */
  barMax: number;
  /** Full financial breakdown for the period. */
  report: PeriodReport;
  /** Keeper's contextual line for the summary phase. */
  keeperLine: WatcherLine;
  /** Active savings goal progress, if any. */
  goal: GoalStatus | null;
  continueNext: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Reads the frozen plan/fact of the `summary` phase. Settlement happens on
 * the recovery screen after the child picks a next step (or skips).
 */
export const usePeriodSummary = (): PeriodSummaryController | null => {
  const router = useRouter();
  const user = useUser();

  if (user?.period.phase !== 'summary') return null;

  const rows = compare(user.period.plan, user.period.fact);
  const explain = explainSummary(rows);
  const barMax = Math.max(
    1,
    ...rows.flatMap((row) => [row.planned, row.actual]),
  );
  const report = buildPeriodReport(user);

  const gameState: WatcherGameState = {
    phase: user.period.phase,
    charge: user.robot.charge,
    spirit: user.robot.spirit,
    hasActiveTask: !!user.tasks.activeTaskId,
    areNeedsMet: user.period.fact.needs >= user.period.plan.needs,
    balance: user.wallet.balance,
    periodIndex: user.period.index,
    platformLevel: user.platform.level,
    moduleTier: user.modules.tier,
  };
  const keeperLine = pickLine(KEEPER_LINES, gameState);

  const activeId = user.savings.activeGoalId;
  const activeRow = activeId
    ? user.savings.goals.find((row) => row.goalId === activeId)
    : null;
  const activeGoal = activeId ? getGoalById(activeId) : null;
  const goal =
    activeId && activeRow && activeGoal
      ? {
          goalId: activeId,
          title: activeGoal.title,
          saved: activeRow.saved,
          price: activeGoal.price,
          isReached:
            activeRow.reachedInPeriod != null ||
            activeRow.saved >= activeGoal.price,
        }
      : null;

  return {
    periodIndex: user.period.index,
    rows,
    explain,
    barMax,
    report,
    keeperLine,
    goal,
    continueNext: () => {
      router.push(STATIC_ROUTES.RECOVERY);
    },
  };
};
