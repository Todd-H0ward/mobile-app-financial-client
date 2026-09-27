import { useMemo } from 'react';

import {
  type BudgetComparison,
  compare,
  explainSummary,
  type SummaryExplain,
} from '@/entities/budget';
import {
  getLastPeriod,
  listPeriodHistory,
  listWalletHistory,
  type PeriodRecord,
  useUserStore,
  type WalletHistoryRow,
} from '@/entities/user';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HistoryController {
  periods: readonly PeriodRecord[];
  lastPeriod: PeriodRecord | null;
  lastRows: BudgetComparison[];
  lastExplain: SummaryExplain | null;
  lastBarMax: number;
  walletRows: readonly WalletHistoryRow[];
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Memoized rows — unrelated settings ticks must not rebuild labels. */
export const useHistory = (): HistoryController => {
  const periodHistory = useUserStore((state) => state.user?.history);
  const walletHistory = useUserStore((state) => state.user?.wallet.history);

  return useMemo(() => {
    if (!periodHistory || !walletHistory) {
      return {
        periods: [],
        lastPeriod: null,
        lastRows: [],
        lastExplain: null,
        lastBarMax: 1,
        walletRows: [],
      };
    }

    // Reconstruct the minimal shape the list helpers expect — they only read these two arrays
    const user = {
      history: periodHistory,
      wallet: { history: walletHistory },
    } as Parameters<typeof listPeriodHistory>[0];

    const lastPeriod = getLastPeriod(user);
    const lastRows = lastPeriod
      ? compare(lastPeriod.plan, lastPeriod.fact)
      : [];
    const lastExplain = lastPeriod ? explainSummary(lastRows) : null;
    const lastBarMax = Math.max(
      1,
      ...lastRows.flatMap((row) => [row.planned, row.actual]),
    );

    return {
      periods: listPeriodHistory(user),
      lastPeriod,
      lastRows,
      lastExplain,
      lastBarMax,
      walletRows: listWalletHistory(user),
    };
  }, [periodHistory, walletHistory]);
};

export type { HistoryController };
