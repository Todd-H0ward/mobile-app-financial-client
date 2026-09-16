import type { EmotionKey } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Where a touch landed on the pet, top to bottom.
 *
 * Zones are soft bands, not hitboxes drawn on screen — a child aims at the
 * animal, not at invisible rectangles.
 */
type PetZone = 'scruff' | 'head' | 'belly' | 'paws';

/**
 * What the child did.
 *
 * `poke` is a soft boop, never a kick: 3.5 forbids anything that reads as
 * hurting the pet. `lift` is a gentle scruff hang, Talking-Tom style.
 */
type PetInteractionKind = 'poke' | 'stroke' | 'lift';

/** A short-lived face+motion override that then yields back to the mood. */
interface PetReaction {
  /** Face (and its idle animation) to show while the reaction lasts. */
  emotion: EmotionKey;
  /** How long the override stays up, ms. */
  durationMs: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Share of the pet's height that belongs to each zone, top → bottom. */
const ZONE_BANDS: { zone: PetZone; until: number }[] = [
  { zone: 'scruff', until: 0.2 },
  { zone: 'head', until: 0.42 },
  { zone: 'belly', until: 0.72 },
  { zone: 'paws', until: 1 },
];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Maps a touch Y (in the pet's local box) to a body zone.
 *
 * @param y distance from the top of the pet, design points
 * @param height the pet box height, design points
 */
export const zoneAt = (y: number, height: number): PetZone => {
  if (!(height > 0) || !Number.isFinite(y)) return 'belly';

  const ratio = Math.min(Math.max(y / height, 0), 1);

  for (const band of ZONE_BANDS) {
    if (ratio <= band.until) return band.zone;
  }

  return 'paws';
};

/**
 * The face a gesture earns.
 *
 * Soft reactions only: hearts and wobbles, never an alarm. The mood face
 * returns after `durationMs`, so a poke cannot permanently override hunger.
 */
export const reactionFor = (
  kind: PetInteractionKind,
  zone: PetZone,
): PetReaction => {
  if (kind === 'lift') {
    return { emotion: 'dangled', durationMs: 1600 };
  }

  if (kind === 'stroke') {
    if (zone === 'head' || zone === 'scruff') {
      return { emotion: 'loved', durationMs: 1700 };
    }

    return { emotion: 'tickled', durationMs: 1700 };
  }

  // poke
  switch (zone) {
    case 'scruff':
      return { emotion: 'curious', durationMs: 1100 };
    case 'head':
      return { emotion: 'booped', durationMs: 1200 };
    case 'belly':
      return { emotion: 'playful', durationMs: 1400 };
    case 'paws':
      return { emotion: 'surprised', durationMs: 1200 };
  }
};

export type { PetInteractionKind, PetReaction, PetZone };
