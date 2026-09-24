import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  type BudgetComparison,
  compare,
  explainSummary,
  type SummaryExplain,
} from '@/entities/budget';
import { type GateChallenge, makeGateChallenge } from '@/entities/settings';
import {
  buildParentsReport,
  type ParentsReport,
  useIsParentGateEnabled,
  useUser,
} from '@/entities/user';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One glance at where the child is — the terminal readout on top. */
interface ParentsStatus {
  playerName: string;
  /** Name the child gave the robot; empty until it is asked for. */
  robotName: string;
  /** The period being played now, from 1. */
  periodIndex: number;
  finishedPeriods: number;
  tasksDone: number;
}

interface ParentsController {
  isLocked: boolean;
  /** The question on the barrier. Replaced after every wrong answer. */
  challenge: GateChallenge;
  unlock: () => void;
  /** Hands out a fresh question — a wrong answer never locks anything. */
  refreshChallenge: () => void;
  /** The four answers of docs/parents.md, or `null` with no profile. */
  report: ParentsReport | null;
  /** Readout for the terminal, or `null` with no profile. */
  status: ParentsStatus | null;
  /** Plan against fact for the last finished period. */
  lastRows: BudgetComparison[];
  /** Which story explains that distribution, for the line under the bars. */
  lastExplain: SummaryExplain | null;
  /** One ceiling for the three bars, so they share a scale. */
  barMax: number;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * The grown-up's section: the barrier, then the report.
 *
 * The gate is screen state and never reaches the save — closing the section is
 * the app going back, and a "unlocked" flag written to disk would quietly turn
 * a barrier into a door left open.
 */
export const useParents = (): ParentsController => {
  const user = useUser();
  const isGateEnabled = useIsParentGateEnabled();

  const [challenge, setChallenge] = useState<GateChallenge>(() =>
    makeGateChallenge(),
  );
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Leaving the section must close the door again — docs/parents.md. The flag
  // is screen state only; a blur cleanup covers both a pop and a soft freeze
  // where the route stays mounted in the stack.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsUnlocked(false);
        setChallenge(makeGateChallenge());
      };
    }, []),
  );

  const report = user ? buildParentsReport(user) : null;
  const lastRows = report?.lastPeriod
    ? compare(report.lastPeriod.plan, report.lastPeriod.fact)
    : [];

  return {
    isLocked: isGateEnabled && !isUnlocked,
    challenge,
    unlock: () => setIsUnlocked(true),
    refreshChallenge: () => setChallenge(makeGateChallenge()),
    report,
    status:
      user && report
        ? {
            playerName: user.playerName,
            robotName: user.robot.name,
            periodIndex: user.period.index,
            finishedPeriods: user.history.length,
            tasksDone: report.tasksDone,
          }
        : null,
    lastRows,
    lastExplain: lastRows.length > 0 ? explainSummary(lastRows) : null,
    barMax: Math.max(
      1,
      ...lastRows.flatMap((row) => [row.planned, row.actual]),
    ),
  };
};

export type { ParentsController, ParentsStatus };
