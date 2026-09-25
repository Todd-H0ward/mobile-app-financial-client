import { Redirect } from 'expo-router';

import { DYNAMIC_ROUTES } from '@/shared/constants';

/** Bare `/shop` opens the workshop — the only shopfront left. */
export default function ShopIndex() {
  return <Redirect href={DYNAMIC_ROUTES.shop('workshop')} />;
}
