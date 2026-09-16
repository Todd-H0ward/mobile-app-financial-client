import { useRouter } from 'expo-router';

import {
  type BudgetComparison,
  compare,
  explainSummary,
  type SummaryExplain,
} from '@/entities/budget';
import { acknowledgeSummary, useUpdateUser, useUser } from '@/entities/user';

import { ROUTES } from '@/shared/constants';
import { useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PeriodSummaryController {
  /** Period number shown in the title. */
  periodIndex: number;
  /** Three comparison rows, always. */
  rows: BudgetComparison[];
  /** Story + recovery tips for the copy layer. */
  explain: SummaryExplain;
  /** Largest of plan/fact across rows — shared scale for the bars. */
  barMax: number;
  /** Settles the period and returns home. */
  continueNext: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Reads the frozen plan/fact of the `summary` phase and dismisses into the
 * next planning period via `acknowledgeSummary`.
 */
export const usePeriodSummary = (): PeriodSummaryController | null => {
  const router = useRouter();
  const time = useTimeSource();
  const user = useUser();
  const updateUser = useUpdateUser();

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
      updateUser((current) => acknowledgeSummary(current, time));
      router.replace(ROUTES.HOME);
    },
  };
};
