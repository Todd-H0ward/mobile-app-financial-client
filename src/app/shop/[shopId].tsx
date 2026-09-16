import { Redirect, useLocalSearchParams } from 'expo-router';

import { ROUTES } from '@/shared/constants';

import { ShopRouteScreen } from '@/screens/shop';

const ShopRoute = () => {
  const { shopId } = useLocalSearchParams<{ shopId: string }>();

  if (typeof shopId !== 'string') {
    return <Redirect href={ROUTES.HOME} />;
  }

  return <ShopRouteScreen shopId={shopId} />;
};

export default ShopRoute;
