import { Redirect, useLocalSearchParams } from 'expo-router';

import { PlaykitScreen } from '@/widgets/minigame/playkit';

import { isPlaykitGameId } from '@/entities/minigame';

import { STATIC_ROUTES } from '@/shared/constants';

/**
 * Overseer gesture games — one dynamic route for all playkit ids.
 */
export const PlayRouteScreen = () => {
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();
  if (!gameId || !isPlaykitGameId(gameId)) {
    return <Redirect href={STATIC_ROUTES.GAMES} />;
  }
  return <PlaykitScreen gameId={gameId} />;
};
