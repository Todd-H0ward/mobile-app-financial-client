import { Redirect } from 'expo-router';

import { DYNAMIC_ROUTES } from '@/shared/constants';

/** Bare `/shop` opens the grocery — the street always names a shopfront. */
export default function ShopIndex() {
  return <Redirect href={DYNAMIC_ROUTES.shop('grocery')} />;
}
