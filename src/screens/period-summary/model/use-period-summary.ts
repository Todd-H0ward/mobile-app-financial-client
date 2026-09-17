import { useRouter } from 'expo-router';

import {
  type BudgetComparison,
  compare,
  explainSummary,
  type SummaryExplain,
} from '@/entities/budget';
import { useUser } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PeriodSummaryController {
    periodIndex: number;
  /** Three comparison rows, always. */
  rows: BudgetComparison[];
  /** Story for the copy layer — tips live on the recovery screen. */
  explain: SummaryExplain;
  /** Largest of plan/fact across rows — shared scale for the bars. */
  barMax: number;
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

  return {
    periodIndex: user.period.index,
    rows,
    explain,
    barMax,
    continueNext: () => {
      router.push(STATIC_ROUTES.RECOVERY);
    },
  };
};
