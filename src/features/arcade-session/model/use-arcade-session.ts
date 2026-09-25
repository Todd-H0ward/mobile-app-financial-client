import { useCallback, useState } from 'react';

import type { GameId } from '@/entities/minigame';
import {
  arcadePaidRemaining,
  beginArcadeSession,
  completeArcadeSession,
  useUser,
  useUserStore,
} from '@/entities/user';

import { useTimeSource } from '@/shared/lib';

/** The screen keeps only a handle; the profile owns identity, consumption and pay. */
export const useArcadeSession = (gameId: GameId) => {
  const time = useTimeSource();
  const user = useUser();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const start = useCallback(() => {
    const { user, commitUser } = useUserStore.getState();
    if (!user) return false;
    const next = beginArcadeSession(user, gameId);
    if (!commitUser(user, next)) return false;
    setSessionId(next.arcade.sequence);
    return true;
  }, [gameId]);
  const complete = useCallback(() => {
    const { user, commitUser } = useUserStore.getState();
    if (!user || sessionId === null) return null;
    const result = completeArcadeSession(user, sessionId, gameId, time);
    if (result.reason === 'duplicate' || !commitUser(user, result.user))
      return null;
    setSessionId(null);
    return result;
  }, [gameId, sessionId, time]);
  return {
    start,
    complete,
    paidRemaining: user ? arcadePaidRemaining(user, time.now()) : 0,
  };
};
