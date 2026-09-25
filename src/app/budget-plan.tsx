import { Redirect } from 'expo-router';

import { DYNAMIC_ROUTES } from '@/shared/constants';

/** Plan is made on the Keeper terminal. */
export default function BudgetPlanRoute() {
  return <Redirect href={DYNAMIC_ROUTES.watcher('keeper', 'plan')} />;
}
