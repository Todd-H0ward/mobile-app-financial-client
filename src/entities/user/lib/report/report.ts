import {
  type GrowthProgress,
  type PetStage,
  progressToNextStage,
} from '@/entities/pet';
import { getTaskById, TASK_THEMES, type TaskTheme } from '@/entities/task';

import type { PeriodRecord, UserSave } from '../../model';
import { listWalletHistory } from '../history';
import { growthFacts } from '../period';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Coins in and out of one period. */
interface PeriodEarnings {
  /** Period number, from 1. */
  periodIndex: number;
  /** Coins credited during it. */
  earned: number;
  /** Coins spent during it — purchases and deposits alike. */
  spent: number;
}

/** How many chores of one theme are done. */
interface ThemeTally {
  theme: TaskTheme;
  done: number;
}

/** Where the pet is and what the next stage still asks for. */
interface GrowthReport {
  stage: PetStage;
  /** `null` at the last stage — there is nothing left to reach. */
  progress: GrowthProgress | null;
}

/**
 * The four questions docs/parents.md says a grown-up actually has, answered
 * from what the child already sees.
 *
 * Nothing extra is collected and nothing is sent anywhere: this is the same
 * wallet history and the same period totals, counted a second way.
 */
interface ParentsReport {
  /** Oldest period first, so a chart reads left to right like a calendar. */
  earnings: PeriodEarnings[];
  /** The last finished period — `null` before the first settlement. */
  lastPeriod: PeriodRecord | null;
  /** Chores by theme, in catalogue order. Themes with none stay, at zero. */
  tasksByTheme: ThemeTally[];
  /** Chores done in total, across the window the wallet still remembers. */
  tasksDone: number;
  growth: GrowthReport;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Coins per period, over the stretch the wallet still holds.
 *
 * The window is deliberately the wallet's own: history is trimmed to
 * `WALLET_HISTORY_LIMIT` because it is a report and not an archive
 * (docs/economy.md), so the chart covers what is actually known rather than
 * drawing an honest-looking zero for a period whose lines have aged out.
 */
const earningsByPeriod = (user: UserSave): PeriodEarnings[] => {
  const tally = new Map<number, PeriodEarnings>();

  const touch = (periodIndex: number) => {
    const row = tally.get(periodIndex) ?? { periodIndex, earned: 0, spent: 0 };
    tally.set(periodIndex, row);

    return row;
  };

  for (const entry of user.wallet.history) {
    const row = touch(entry.periodIndex);

    if (entry.kind === 'earn') row.earned += entry.amount;
    else row.spent += entry.amount;
  }

  // The running period always gets a column, even before it earns anything:
  // an absent "now" reads as a broken chart rather than as an empty week.
  touch(user.period.index);

  return [...tally.values()].sort((a, b) => a.periodIndex - b.periodIndex);
};

/**
 * Chores by theme, counted off the wallet.
 *
 * `TasksSave.completedThisPeriod` is wiped every settlement, so the only place
 * a finished chore survives is the coin it paid — which is exactly the record
 * 2.5.4 made sure carries its source.
 */
const tasksByTheme = (user: UserSave): ThemeTally[] => {
  const tally = new Map<TaskTheme, number>(
    TASK_THEMES.map((theme) => [theme, 0]),
  );

  for (const row of listWalletHistory(user)) {
    if (row.source.kind !== 'task') continue;

    const theme = getTaskById(row.source.taskId)?.theme;
    if (!theme) continue;

    tally.set(theme, (tally.get(theme) ?? 0) + 1);
  }

  return TASK_THEMES.map((theme) => ({ theme, done: tally.get(theme) ?? 0 }));
};

// ═══════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════

/** The grown-up's report, built from the child's own numbers. */
export const buildParentsReport = (user: UserSave): ParentsReport => {
  const themes = tasksByTheme(user);

  return {
    earnings: earningsByPeriod(user),
    lastPeriod: user.history[user.history.length - 1] ?? null,
    tasksByTheme: themes,
    tasksDone: themes.reduce((total, row) => total + row.done, 0),
    growth: {
      stage: user.pet.stage,
      progress: progressToNextStage(user.pet.stage, growthFacts(user.history)),
    },
  };
};

export type { GrowthReport, ParentsReport, PeriodEarnings, ThemeTally };
