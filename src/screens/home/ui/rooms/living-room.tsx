import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { PetBox } from '@/widgets/pet-box';

import type { CatalogueItem } from '@/entities/catalogue';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';

import { ToyShelfSheet } from '../toy-shelf-sheet';

import { RoomHotspot } from './room-hotspot';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LivingRoomProps {
  /**
   * Whether the meeting has happened. Once the pet is met it walks with the
   * child as `HomePetCompanion` — this room only keeps the closed box.
   */
  isPetMet: boolean;
  onOpenBox: () => void;
  /** Toys already bought — drives the shelf hotspot and its menu. */
  ownedToys: readonly CatalogueItem[];
  onPlayToy: (furnitureId: string) => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * How far up from the bottom the box sits — the same inset the companion uses
 * once the pet is out, so the hand-off does not jump on the floor.
 */
const FLOOR_INSET = 190;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Home before the meeting: the closed box on the floorboards.
 *
 * After the box opens, the pet leaves with the child — see
 * `HomePetCompanion`. Bought toys land on a shelf hotspot; tapping it opens
 * a pick-a-toy menu.
 */
export const LivingRoom = ({
  isPetMet,
  onOpenBox,
  ownedToys,
  onPlayToy,
}: LivingRoomProps) => {
  const { t } = useTranslation();
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const hasToyShelf = ownedToys.length > 0;

  const playToy = (furnitureId: string) => {
    setIsShelfOpen(false);
    onPlayToy(furnitureId);
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {hasToyShelf && (
        <RoomHotspot
          label={t('home.toyShelf')}
          text={t('home.toyShelfHint')}
          tone="coin"
          onPress={() => setIsShelfOpen(true)}
          style={styles.shelf}
        />
      )}

      {!isPetMet && (
        <View style={styles.stage}>
          <PetBox
            onPress={onOpenBox}
            label={t('home.petBoxInvite')}
            isPulsing
          />
        </View>
      )}

      <ToyShelfSheet
        toys={ownedToys}
        isVisible={isShelfOpen}
        onClose={() => setIsShelfOpen(false)}
        onPlayToy={playToy}
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
    justifyContent: 'flex-end',
    paddingBottom: FLOOR_INSET,
  },
  shelf: {
    left: '8%',
    top: '38%',
  },
  stage: {
    alignItems: 'center',
    gap: SPACING.two,
  },
});

export type { LivingRoomProps };
