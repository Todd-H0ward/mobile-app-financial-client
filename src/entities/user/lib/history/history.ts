import { getCatalogueItem } from '@/entities/catalogue';
import { WALLET_SOURCES } from '@/entities/economy';
import { getGoalById } from '@/entities/goal';
import { getTaskById } from '@/entities/task';

import type { PeriodRecord, UserSave, WalletEntry } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Named wallet source for history / HUD — never a bare id on screen.
 * The UI maps this through i18n; content titles ride along when known.
 */
type WalletSourceRef =
  | { kind: 'startingWallet' }
  | { kind: 'regularityBonus' }
  | { kind: 'heatingBill' }
  | { kind: 'gamePuzzle' }
  | { kind: 'gameSpacewar' }
  | { kind: 'gameSnake' }
  | { kind: 'task'; taskId: string; title: string }
  | { kind: 'purchase'; itemId: string; title: string }
  | { kind: 'savingsDeposit'; goalId: string; title: string }
  | { kind: 'savingsWithdraw'; goalId: string; title: string }
  | { kind: 'unknown' };

/** One wallet line ready for the history list. */
interface WalletHistoryRow {
  entry: WalletEntry;
  source: WalletSourceRef;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Finished periods, newest first — the grown-up's and child's report (2.5.11).
 */
export const listPeriodHistory = (user: UserSave): readonly PeriodRecord[] =>
  [...user.history].reverse();

/** The most recent finished period, or null before the first settlement. */
export const getLastPeriod = (user: UserSave): PeriodRecord | null => {
  if (user.history.length === 0) return null;
  return user.history[user.history.length - 1] ?? null;
};

/**
 * Resolves a wallet `source` string into a labeled ref for the UI.
 *
 * Static rule sources use `WALLET_SOURCES`; dynamic ones carry a content title
 * so the screen never shows a bare `task:…` id (2.5.4 / 2.5.11).
 */
export const describeWalletSource = (source: string): WalletSourceRef => {
  if (source === WALLET_SOURCES.startingWallet) {
    return { kind: 'startingWallet' };
  }
  if (source === WALLET_SOURCES.regularityBonus) {
    return { kind: 'regularityBonus' };
  }
  if (source === WALLET_SOURCES.heatingBill) {
    return { kind: 'heatingBill' };
  }
  if (source === WALLET_SOURCES.gamePuzzle) {
    return { kind: 'gamePuzzle' };
  }
  if (source === WALLET_SOURCES.gameSpacewar) {
    return { kind: 'gameSpacewar' };
  }
  if (source === WALLET_SOURCES.gameSnake) {
    return { kind: 'gameSnake' };
  }

  if (source.startsWith('task:')) {
    const taskId = source.slice('task:'.length);
    const task = getTaskById(taskId);
    return {
      kind: 'task',
      taskId,
      title: task?.title ?? taskId,
    };
  }

  if (source.startsWith('purchase:')) {
    const itemId = source.slice('purchase:'.length);
    const item = getCatalogueItem(itemId);
    return {
      kind: 'purchase',
      itemId,
      title: item?.title ?? itemId,
    };
  }

  if (source.startsWith('savings:deposit:')) {
    const goalId = source.slice('savings:deposit:'.length);
    const goal = getGoalById(goalId);
    return {
      kind: 'savingsDeposit',
      goalId,
      title: goal?.title ?? goalId,
    };
  }

  if (source.startsWith('savings:withdraw:')) {
    const goalId = source.slice('savings:withdraw:'.length);
    const goal = getGoalById(goalId);
    return {
      kind: 'savingsWithdraw',
      goalId,
      title: goal?.title ?? goalId,
    };
  }

  return { kind: 'unknown' };
};

/**
 * Wallet operations newest first, each with a resolved source label.
 * The array is already newest-first in the save; we only attach labels.
 */
export const listWalletHistory = (
  user: UserSave,
): readonly WalletHistoryRow[] =>
  user.wallet.history.map((entry) => ({
    entry,
    source: describeWalletSource(entry.source),
  }));

export type { WalletHistoryRow, WalletSourceRef };
