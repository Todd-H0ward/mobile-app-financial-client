import { Redirect, useLocalSearchParams } from 'expo-router';

import { STATIC_ROUTES } from '@/shared/constants';

import { PuzzleRouteScreen } from '@/screens/games';

const asString = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
    return value[0];
  }
  return null;
};

export default function PuzzleRoute() {
  const puzzleId = asString(
    useLocalSearchParams<{ puzzleId?: string | string[] }>().puzzleId,
  );

  if (!puzzleId) {
    return <Redirect href={STATIC_ROUTES.GAMES} />;
  }

  return <PuzzleRouteScreen puzzleId={puzzleId} />;
}
