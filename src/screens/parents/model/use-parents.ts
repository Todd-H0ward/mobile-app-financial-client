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

interface ParentsStatus {
  playerName: string;
  robotName: string;
  periodIndex: number;
  finishedPeriods: number;
  tasksDone: number;
}

interface ParentsController {
  /** Current service section; never persisted in the child save. */
  section: 'overview' | 'topics' | 'manage';
  setSection: (section: 'overview' | 'topics' | 'manage') => void;
  isLocked: boolean;
  challenge: GateChallenge;
  unlock: () => void;
  /** Hands out a fresh question — a wrong answer never locks anything. */
  refreshChallenge: () => void;
  /** The four answers of docs/parents.md, or `null` with no profile. */
  report: ParentsReport | null;
  status: ParentsStatus | null;
  lastRows: BudgetComparison[];
  lastExplain: SummaryExplain | null;
  barMax: number;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Gate stays screen state — a persisted unlock would leave the door open. */
export const useParents = (): ParentsController => {
  const user = useUser();
  const isGateEnabled = useIsParentGateEnabled();

  const [challenge, setChallenge] = useState<GateChallenge>(() =>
    makeGateChallenge(),
  );
  const [section, setSection] = useState<'overview' | 'topics' | 'manage'>(
    'overview',
  );
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Blur cleanup covers pop and soft freeze where the route stays mounted.
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
    section,
    setSection,
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
