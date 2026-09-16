import {
  PET_INK,
  PET_PALETTE,
  type PetColor,
  type PetPattern,
  type PetPatternMarks,
  type PetSilhouette,
  type PetSkin,
  type PetSpecies,
} from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Proportions per species. These carry requirement 2.5.2 on their own: three
 * silhouettes × three coats is the nine, before pattern is applied at all.
 *
 * The numbers are relations, not measurements — the art does not exist yet. The
 * test asserts the relations (a capybara is wider than a cat), so they can be
 * retuned against real drawings without rewriting a single test.
 */
const SILHOUETTES: Record<PetSpecies, PetSilhouette> = {
  cat: {
    bodyRatio: 0.78,
    earShape: 'pointed',
    headRatio: 0.46,
    tailShape: 'long',
  },
  dog: {
    bodyRatio: 0.9,
    earShape: 'floppy',
    headRatio: 0.5,
    tailShape: 'stub',
  },
  capybara: {
    bodyRatio: 1.15,
    earShape: 'round',
    headRatio: 0.4,
    tailShape: 'none',
  },
};

/** The pattern layer per axis value. Big marks: a subtle texture fails 2.5.2. */
const MARKS: Record<PetPattern, PetPatternMarks> = {
  solid: { count: 0, kind: 'none', size: 0 },
  spots: { count: 5, kind: 'spots', size: 0.14 },
  stripes: { count: 4, kind: 'stripes', size: 0.08 },
};

// ═══════════════════════════════════════════
// SKIN
// ═══════════════════════════════════════════

/** Proportions alone, for a renderer that lays out before it fills. */
export const silhouetteFor = (species: PetSpecies): PetSilhouette => ({
  ...SILHOUETTES[species],
});

/**
 * The whole look of one pet.
 *
 * Total: every one of the 27 combinations returns a skin, with no fallback
 * branch anywhere. Pure and theme-independent — a coat that changed with the
 * color scheme would make one pet read as two, and 2.5.2 is judged on two
 * screenshots side by side.
 */
export const skinFor = (
  species: PetSpecies,
  color: PetColor,
  pattern: PetPattern,
): PetSkin => {
  const coat = PET_PALETTE[color];

  return {
    species,
    pattern,
    silhouette: silhouetteFor(species),
    coat: coat.coat,
    shade: coat.shade,
    belly: coat.belly,
    ink: coat.ink,
    outline: PET_INK.outline,
    eye: PET_INK.eye,
    blush: PET_INK.blush,
    marks: { ...MARKS[pattern] },
  };
};
