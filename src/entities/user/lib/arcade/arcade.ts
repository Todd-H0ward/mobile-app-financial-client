import { type GameId, payoutFor } from '@/entities/minigame';
import {
  recordSnakeScore,
  recordSpacewarTime,
} from '@/entities/minigame/console';
import { financeWeek } from '@/entities/minigame/finance';

import type { TimeSource } from '@/shared/lib/time-source';

import type { UserSave } from '../../model/types';
import { creditWallet } from '../wallet';

export const ARCADE_PAID_SITTINGS = 3;
const DAY_MS = 86_400_000;

export const arcadePaidRemaining = (user: UserSave, at: number): number => {
  if (user.period.phase !== 'active') return 0;
  const day = Math.floor(at / DAY_MS);
  return day > user.arcade.paidDay
    ? ARCADE_PAID_SITTINGS
    : Math.max(0, ARCADE_PAID_SITTINGS - user.arcade.paidCount);
};

/** Starting another game abandons the prior session without paying it. */
export const beginArcadeSession = (
  user: UserSave,
  gameId: GameId,
): UserSave => ({
  ...user,
  arcade: {
    ...user.arcade,
    sequence: user.arcade.sequence + 1,
    active: { id: user.arcade.sequence + 1, gameId },
  },
});

/** Consumes the session and its reward together in the same profile snapshot. */
export const completeArcadeSession = (
  user: UserSave,
  id: number,
  gameId: GameId,
  time: TimeSource,
  score?: number,
  isCorrect = true,
): {
  user: UserSave;
  coins: number;
  reason: 'paid' | 'limit' | 'planning' | 'duplicate' | 'weekly';
} => {
  if (user.arcade.active?.id !== id || user.arcade.active.gameId !== gameId) {
    return { user, coins: 0, reason: 'duplicate' };
  }
  const at = time.now();
  // Moving the clock backwards must not create another set of paid sittings.
  const day = Math.max(user.arcade.paidDay, Math.floor(at / DAY_MS));
  const paidCount = day > user.arcade.paidDay ? 0 : user.arcade.paidCount;
  const reason =
    user.period.phase !== 'active'
      ? 'planning'
      : gameId === 'weekly' && financeWeek(at) <= user.arcade.paidWeek
        ? 'weekly'
        : paidCount >= ARCADE_PAID_SITTINGS
          ? 'limit'
          : 'paid';
  const coins = reason === 'paid' ? payoutFor({ gameId, isCorrect }) : 0;
  const wallet =
    coins > 0
      ? creditWallet(user.wallet, {
          source: `game:${gameId}`,
          amount: coins,
          direction: null,
          periodIndex: user.period.index,
          at,
        })
      : user.wallet;
  return {
    coins,
    reason,
    user: {
      ...user,
      wallet,
      arcade: {
        ...user.arcade,
        active: null,
        scores: {
          snake:
            gameId === 'snake' && score !== undefined
              ? recordSnakeScore(user.arcade.scores.snake, score)
              : user.arcade.scores.snake,
          spacewarMs:
            gameId === 'spacewar' && score !== undefined
              ? recordSpacewarTime(user.arcade.scores.spacewarMs, score)
              : user.arcade.scores.spacewarMs,
        },
        paidDay: day,
        paidWeek:
          gameId === 'weekly' && coins > 0
            ? Math.max(user.arcade.paidWeek, financeWeek(at))
            : user.arcade.paidWeek,
        paidCount: paidCount + (coins > 0 ? 1 : 0),
      },
    },
  };
};
