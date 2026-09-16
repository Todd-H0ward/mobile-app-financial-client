import { StyleSheet, View } from 'react-native';

import { PetBox } from '@/widgets/pet-box';

import { SPACING } from '@/shared/constants';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LivingRoomProps {
  /**
   * Whether the meeting has happened. Once the pet is met it walks with the
   * child as `HomePetCompanion` — this room only keeps the closed box.
   */
  isPetMet: boolean;
  /** Opens the meeting screen. Only reachable while the box is closed. */
  onOpenBox: () => void;
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
 * `HomePetCompanion`. Keeping the box here (and only here) is what makes
 * "this is where we live" readable on the first visit.
 */
export const LivingRoom = ({ isPetMet, onOpenBox }: LivingRoomProps) => {
  if (isPetMet) {
    return <View pointerEvents="box-none" style={styles.root} />;
  }

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.stage}>
        <PetBox onPress={onOpenBox} />
      </View>
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
  stage: {
    alignItems: 'center',
    gap: SPACING.two,
  },
});

export type { LivingRoomProps };
