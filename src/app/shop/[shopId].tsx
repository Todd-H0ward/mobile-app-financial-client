import { Redirect, useLocalSearchParams } from 'expo-router';

import { ShopRouteScreen } from '@/screens/shop';

import { STATIC_ROUTES } from '@/shared/constants';

const ShopRoute = () => {
  const { shopId } = useLocalSearchParams<{ shopId: string }>();

  if (typeof shopId !== 'string') {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return <ShopRouteScreen shopId={shopId} />;
};

export default ShopRoute;
