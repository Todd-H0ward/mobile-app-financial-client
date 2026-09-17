import { Redirect, useLocalSearchParams } from 'expo-router';

import { STATIC_ROUTES } from '@/shared/constants';

import { WithdrawRouteScreen } from '@/screens/savings';

/** First value when expo-router hands an array for a query / segment. */
const asString = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
    return value[0];
  }
  return null;
};

export default function WithdrawRoute() {
  const params = useLocalSearchParams<{
    goalId?: string | string[];
    amount?: string | string[];
  }>();
  const goalId = asString(params.goalId);
  const amount = asString(params.amount);

  if (!goalId) {
    return <Redirect href={STATIC_ROUTES.SAVINGS} />;
  }

  return (
    <WithdrawRouteScreen goalId={goalId} amountParam={amount ?? undefined} />
  );
}
