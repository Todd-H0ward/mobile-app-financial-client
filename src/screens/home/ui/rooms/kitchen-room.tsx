import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/shared/i18n';

import { RoomHotspot } from './room-hotspot';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * The kitchen: where feeding will live.
 *
 * Two plates on the two things a child looks for — where food is kept and
 * where it is cooked — so the room is already legible with nothing behind it.
 */
export const KitchenRoom = () => {
  const { t } = useTranslation();

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
