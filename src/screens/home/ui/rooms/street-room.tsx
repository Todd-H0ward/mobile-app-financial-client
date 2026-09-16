import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/shared/i18n';

import { RoomHotspot } from './room-hotspot';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The street: where the shop will be — roadmap wave 1, item 11.
 *
 * The plates sit on the two shopfronts the art already draws, so the room
 * teaches its own layout before it does anything: this side is groceries,
 * that side is toys.
 */
export const StreetRoom = () => {
  const { t } = useTranslation();

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <RoomHotspot
        label={t('rooms.soon.shopTitle')}
        text={t('rooms.soon.shopText')}
        style={styles.shop}
      />

      <RoomHotspot
        label={t('rooms.soon.toysTitle')}
        text={t('rooms.soon.toysText')}
        style={styles.toys}
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
  shop: {
    left: '6%',
    top: '46%',
  },
  toys: {
    right: '8%',
    top: '38%',
  },
});
