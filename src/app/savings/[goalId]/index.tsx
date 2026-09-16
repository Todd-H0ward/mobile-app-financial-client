import { Redirect, useLocalSearchParams } from 'expo-router';

import { ROUTES } from '@/shared/constants';

import { GoalRouteScreen } from '@/screens/savings';

export default function GoalRoute() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();

  if (typeof goalId !== 'string') {
    return <Redirect href={ROUTES.SAVINGS} />;
  }

  return <GoalRouteScreen goalId={goalId} />;
}
