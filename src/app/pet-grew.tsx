import { useLocalSearchParams } from 'expo-router';

import { ROUTES, type RoutePath } from '@/shared/constants';

import { PetGrewScreen } from '@/screens/pet-grew';

/** First value when expo-router hands an array for a query / segment. */
const asRoute = (value: string | string[] | undefined): RoutePath => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === ROUTES.BUDGET_PLAN ? ROUTES.BUDGET_PLAN : ROUTES.HOME;
};

export default function PetGrewRoute() {
  const params = useLocalSearchParams<{ destination?: string | string[] }>();

  return <PetGrewScreen destination={asRoute(params.destination)} />;
}
