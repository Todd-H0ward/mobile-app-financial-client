import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { DYNAMIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';

import { RoomHotspot } from './room-hotspot';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The kitchen: where feeding will live.
 *
 * Fridge already opens the grocery shop — one real door so the room is not
 * only "скоро". The stove keeps the honest soon-sheet until cooking lands.
 */
export const KitchenRoom = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <RoomHotspot
        label={t('rooms.soon.stoveTitle')}
        text={t('rooms.soon.stoveText')}
        style={styles.stove}
      />

      <RoomHotspot
        label={t('rooms.soon.fridgeTitle')}
        text={t('rooms.soon.fridgeText')}
        tone="success"
        onPress={() => router.push(DYNAMIC_ROUTES.shop('grocery'))}
        style={styles.fridge}
      />
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
  fridge: {
    right: '6%',
    top: '42%',
  },
  stove: {
    left: '5%',
    top: '44%',
  },
});
