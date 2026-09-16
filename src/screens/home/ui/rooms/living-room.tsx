import { StyleSheet, View } from 'react-native';

import { PetBox } from '@/widgets/pet-box';

import { PetView } from '@/entities/pet/ui';

import { SPACING } from '@/shared/constants';

import type { HomeHudPet } from '../../model';
import { HomeHudMood } from '../home-hud';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LivingRoomProps {
  /** `null` while the box has not been opened yet. */
  pet: HomeHudPet | null;
  isAnimated: boolean;
  /** Opens the meeting screen. Only reachable while the box is closed. */
  onOpenBox: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Side of the pet standing on the floor. */
const PET_SIZE = 190;

/**
 * How far up from the bottom the pet stands.
 *
 * The art leaves the lower third of every room empty for exactly this: the pet
 * has to stand *on* the floorboards, not float over them or sit behind the
 * board along the bottom edge.
 */
const FLOOR_INSET = 190;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Home: the pet on the floor, with what it feels written under it.
 *
 * The pet lives here and stays here — the child walks to the kitchen for food
 * and out to the street to shop. One pet, one room, which is also what
 * docs/performance.md asks for: never more than one animated pet on screen.
 */
export const LivingRoom = ({ pet, isAnimated, onOpenBox }: LivingRoomProps) => (
  <View pointerEvents="box-none" style={styles.root}>
    {pet ? (
      <View pointerEvents="box-none" style={styles.stage}>
        <PetView
          appearance={pet.appearance}
          emotion={pet.emotion}
          stage={pet.stage}
          size={PET_SIZE}
          isAnimated={isAnimated}
          accessibilityLabel={pet.accessibilityLabel}
        />

        <HomeHudMood label={pet.moodLabel} tone={pet.moodTone} />
      </View>
    ) : (
      <View style={styles.stage}>
        <PetBox onPress={onOpenBox} />
      </View>
    )}
  </View>
);

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    paddingBottom: FLOOR_INSET,
  },
  stage: {
    alignItems: 'center',
    gap: SPACING.two,
  },
});

export type { LivingRoomProps };
