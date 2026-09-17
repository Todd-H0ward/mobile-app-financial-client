import { Redirect, useLocalSearchParams } from 'expo-router';

import { STATIC_ROUTES } from '@/shared/constants';

import { GoalRouteScreen } from '@/screens/savings';

/** First value when expo-router hands an array for a dynamic segment. */
const asString = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
    return value[0];
  }
  return null;
};

export default function GoalRoute() {
  const goalId = asString(
    useLocalSearchParams<{ goalId?: string | string[] }>().goalId,
  );

  if (!goalId) {
    return <Redirect href={STATIC_ROUTES.SAVINGS} />;
  }

  return <GoalRouteScreen goalId={goalId} />;
}
