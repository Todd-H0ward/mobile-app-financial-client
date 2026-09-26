import { Redirect } from 'expo-router';

import { DYNAMIC_ROUTES } from '@/shared/constants';

/** Shop lives inside the Keeper terminal now. */
export default function ShopIndex() {
  return <Redirect href={DYNAMIC_ROUTES.watcher('keeper', 'shop')} />;
}
