import { PLATFORM_GOAL_ID, PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import { getGoalById } from '@/entities/goal';

import type { TimeSource } from '@/shared/lib/time-source';

import type { UserSave } from '../../model/types';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type PlatformResult =
  | { ok: true; user: UserSave }
  | { ok: false; reason: 'wrong_phase' | 'stale_level' | 'insufficient_saved' };

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/** The target comes from the confirmation, not a fresh increment on each tap. */
export const applyPlatformUpgrade = (
  user: UserSave,
  targetLevel: number,
  time: TimeSource,
): PlatformResult => {
  if (user.period.phase !== 'active')
    return { ok: false, reason: 'wrong_phase' };
  const id = `platform:${targetLevel}`;
  if (
    !Number.isInteger(targetLevel) ||
    targetLevel < 1 ||
    targetLevel > PLATFORM_LEVEL_COUNT ||
    targetLevel !== user.platform.level + 1 ||
    user.platform.receipts.some((receipt) => receipt.id === id)
  )
    return { ok: false, reason: 'stale_level' };

  const goal = getGoalById(PLATFORM_GOAL_ID);
  const jar = user.savings.goals.find((row) => row.goalId === PLATFORM_GOAL_ID);
  if (!goal || !jar || jar.saved < goal.price) {
    return { ok: false, reason: 'insufficient_saved' };
  }
  const savingsAfter = jar.saved - goal.price;
  return {
    ok: true,
    user: {
      ...user,
      platform: {
        level: targetLevel,
        receipts: [
          ...user.platform.receipts,
          {
            id,
            level: targetLevel,
            amount: goal.price,
            savingsBefore: jar.saved,
            savingsAfter,
            periodIndex: user.period.index,
            at: time.now(),
          },
        ],
      },
      savings: {
        ...user.savings,
        goals: user.savings.goals.map((row) =>
          row.goalId === PLATFORM_GOAL_ID
            ? { ...row, saved: savingsAfter, reachedInPeriod: null }
            : row,
        ),
      },
    },
  };
};

export type { PlatformResult };
