import { useRouter } from 'expo-router';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { SHOP_IDS, type ShopId } from '@/entities/catalogue';

import { shopPath } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';

import { RoomHotspot, type RoomHotspotTone } from './room-hotspot';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Where each shopfront sits on the street art.
 *
 * Left side: food and clothes. Right side: furniture and toys — the two
 * façades the background already suggests.
 */
const SHOP_PLACEMENT: Record<ShopId, ViewStyle> = {
  grocery: { left: '6%', top: '48%' },
  clothes: { left: '6%', top: '34%' },
  furniture: { right: '8%', top: '50%' },
  toys: { right: '8%', top: '36%' },
};

/**
 * One soft colour per shop so the four plates read as four doors.
 *
 * Grocery → green (food). Clothes → orange. Furniture → teal. Toys → coin.
 */
const SHOP_TONE: Record<ShopId, RoomHotspotTone> = {
  grocery: 'success',
  clothes: 'accent',
  furniture: 'primary',
  toys: 'coin',
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The street: four named shopfronts (grocery, clothes, furniture, toys).
 *
 * Toys will grow mini-games later; today they still sell like the others.
 */
export const StreetRoom = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {SHOP_IDS.map((shopId) => (
        <RoomHotspot
          key={shopId}
          label={t(`rooms.shop.${shopId}.label`)}
          text={t(`rooms.shop.${shopId}.hint`)}
          tone={SHOP_TONE[shopId]}
          onPress={() => router.push(shopPath(shopId))}
          style={SHOP_PLACEMENT[shopId]}
        />
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
  },
});
