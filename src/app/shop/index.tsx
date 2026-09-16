import { Redirect } from 'expo-router';

import { shopPath } from '@/shared/constants';

/** Bare `/shop` opens the grocery — the street always names a shopfront. */
export default function ShopIndex() {
  return <Redirect href={shopPath('grocery')} />;
}
