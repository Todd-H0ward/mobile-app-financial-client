import { Redirect } from 'expo-router';

import { DYNAMIC_ROUTES } from '@/shared/constants';

/** Any shopfront opens the Keeper workshop page. */
export default function ShopRoute() {
  return <Redirect href={DYNAMIC_ROUTES.watcher('keeper', 'shop')} />;
}
