import { Redirect, useLocalSearchParams } from 'expo-router';

import { GoalRouteScreen } from '@/screens/savings';

import { STATIC_ROUTES } from '@/shared/constants';

/** First value when expo-router hands an array. */
const asString = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
    return value[0];
  }
  return null;
};

export default function GoalRoute() {
  const params = useLocalSearchParams<{
    goalId?: string | string[];
    action?: string | string[];
  }>();
  const goalId = asString(params.goalId);

  if (!goalId) {
    return <Redirect href={STATIC_ROUTES.SAVINGS} />;
  }

  return (
    <GoalRouteScreen
      goalId={goalId}
      isLiftRequested={asString(params.action) === 'lift'}
    />
  );
}
