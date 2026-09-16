import { Redirect, useLocalSearchParams } from 'expo-router';

import { ROUTES } from '@/shared/constants';

import { WithdrawRouteScreen } from '@/screens/savings';

export default function WithdrawRoute() {
  const { goalId, amount } = useLocalSearchParams<{
    goalId: string;
    amount?: string;
  }>();

  if (typeof goalId !== 'string') {
    return <Redirect href={ROUTES.SAVINGS} />;
  }

  return (
    <WithdrawRouteScreen
      goalId={goalId}
      amountParam={typeof amount === 'string' ? amount : undefined}
    />
  );
}
