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
  useUser,
  type WalletHistoryRow,
} from '@/entities/user';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HistoryController {
  /** Finished periods, newest first. */
  periods: readonly PeriodRecord[];
  /** Most recent settlement — null before the first one. */
  lastPeriod: PeriodRecord | null;
  /** Plan vs fact rows for the last period, when it exists. */
  lastRows: BudgetComparison[];
  /** Story keys for the last period. */
  lastExplain: SummaryExplain | null;
  /** Shared bar scale for the last-period comparison. */
  lastBarMax: number;
  /** Wallet lines with resolved source labels, newest first. */
  walletRows: readonly WalletHistoryRow[];
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * History queries for the report screen — periods + named wallet lines (2.5.11).
 */
export const useHistory = (): HistoryController => {
  const user = useUser();

  if (!user) {
    return {
      periods: [],
      lastPeriod: null,
      lastRows: [],
      lastExplain: null,
      lastBarMax: 1,
      walletRows: [],
    };
  }

  const lastPeriod = getLastPeriod(user);
  const lastRows = lastPeriod ? compare(lastPeriod.plan, lastPeriod.fact) : [];
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
};

export type { HistoryController };
