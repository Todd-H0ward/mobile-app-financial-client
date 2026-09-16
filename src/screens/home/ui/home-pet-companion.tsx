import { StyleSheet, View } from 'react-native';

import { PetView } from '@/entities/pet/ui';

import { SPACING } from '@/shared/constants';

import type { HomeHudPet } from '../model';

import { HomeHudMood } from './home-hud';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HomePetCompanionProps {
  pet: HomeHudPet;
  isAnimated: boolean;
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
 * board along the bottom edge. Shared across street / living / kitchen so the
 * companion does not jump when the scenery slides.
 */
const FLOOR_INSET = 190;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The pet that stays with the child between rooms.
 *
 * It sits above the room strip, not inside a page: the scenery swipes away
 * while one pet stays planted on the floor. No hop on room change — a nudge
 * next to the doors mounting looked like a layout glitch. docs/performance.md
 * also asks for never more than one animated pet on screen.
 */
export const HomePetCompanion = ({
  pet,
  isAnimated,
}: HomePetCompanionProps) => (
  <View pointerEvents="box-none" style={styles.root}>
    <View pointerEvents="none" style={styles.stage}>
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
    alignSelf: 'center',
    gap: SPACING.two,
  },
});

export type { HomePetCompanionProps };
