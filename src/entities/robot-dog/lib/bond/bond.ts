import type { RobotDogAction, RobotDogMoodName } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** How the child touches the dog in bond mode. */
type BondKind = 'stroke' | 'kick';

/** Particle burst that rides with a bond reaction. */
type BondBurst = 'hearts' | 'sparks' | 'steam' | 'none';

interface BondReaction {
  /** Clip to play once before settling back. */
  action: RobotDogAction;
  /** Burst spawned above the dog's head. */
  burst: BondBurst;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * What the dog does when stroked or kicked in bond mode.
 *
 * Pure show — does not touch charge or spirit. Mood only picks the clip and
 * the burst so a proud dog reads warm and a tired one reads soft.
 */
const bondReaction = (
  mood: RobotDogMoodName | null,
  kind: BondKind,
): BondReaction => {
  if (kind === 'kick') {
    // Proud reads the nudge as play; everyone else flinches.
    if (mood === 'proud') return { action: 'joy', burst: 'sparks' };
    return { action: 'sad', burst: 'sparks' };
  }

  switch (mood) {
    case 'bored':
      return { action: 'walk', burst: 'sparks' };
    case 'tired':
    case 'sad':
      return { action: 'sad', burst: 'steam' };
    case 'proud':
    case 'content':
    case null:
      return { action: 'joy', burst: 'hearts' };
    default:
      return { action: 'joy', burst: 'hearts' };
  }
};

export type { BondBurst, BondKind, BondReaction };
export { bondReaction };
