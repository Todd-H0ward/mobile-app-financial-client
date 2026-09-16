import { clamp } from '@/shared/utils';

import type { PetAnchor, PetAnchors, PetSpecies, PetStage } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Where things attach, per growth stage.
 *
 * A baby is mostly head, so everything below the ears sits lower in the box; an
 * adult's chest is nearer the middle. The ground line never moves: it is the
 * definition of the box's bottom edge.
 */
const ANCHORS_BY_STAGE: Record<PetStage, PetAnchors> = {
  baby: {
    speech: { x: 0.72, y: 0.18 },
    accessory: { x: 0.5, y: 0.08 },
    food: { x: 0.5, y: 0.34 },
    heart: { x: 0.5, y: 0.42 },
    ground: { x: 0.5, y: 1 },
  },
  teen: {
    speech: { x: 0.74, y: 0.14 },
    accessory: { x: 0.5, y: 0.05 },
    food: { x: 0.5, y: 0.3 },
    heart: { x: 0.5, y: 0.46 },
    ground: { x: 0.5, y: 1 },
  },
  adult: {
    speech: { x: 0.76, y: 0.11 },
    accessory: { x: 0.5, y: 0.03 },
    food: { x: 0.5, y: 0.27 },
    heart: { x: 0.5, y: 0.5 },
    ground: { x: 0.5, y: 1 },
  },
};

/**
 * Per-species nudge on top of the stage table.
 *
 * A capybara's head sits low and forward on a barrel body, a dog's muzzle is
 * longer than a cat's. Small numbers on purpose: the stage decides the layout,
 * the species only corrects it.
 */
const SPECIES_OFFSET: Record<PetSpecies, PetAnchor> = {
  cat: { x: 0, y: 0 },
  dog: { x: 0.02, y: 0.02 },
  capybara: { x: 0.04, y: 0.06 },
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** One point, nudged and confined to the box. */
const shift = (anchor: PetAnchor, offset: PetAnchor): PetAnchor => ({
  x: clamp(anchor.x + offset.x, 0, 1),
  y: clamp(anchor.y + offset.y, 0, 1),
});

// ═══════════════════════════════════════════
// ANCHORS
// ═══════════════════════════════════════════

/**
 * Named attachment points for one pet, as fractions of its bounding box.
 *
 * Fractions rather than design points because the pet is drawn at several
 * sizes: the caller multiplies by whatever width and height it rendered at.
 * Depends on silhouette and growth only — a hat sits on the same head whatever
 * the coat, and whatever the pet feels this second.
 */
export const anchorsFor = (
  species: PetSpecies,
  stage: PetStage,
): PetAnchors => {
  const base = ANCHORS_BY_STAGE[stage];
  const offset = SPECIES_OFFSET[species];

  return {
    speech: shift(base.speech, offset),
    accessory: shift(base.accessory, offset),
    food: shift(base.food, offset),
    heart: shift(base.heart, offset),
    // The feet line is the box's bottom edge by definition: a species nudge
    // here would lift the shadow off the floor.
    ground: { ...base.ground },
  };
};
