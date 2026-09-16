import type { PetAppearance, PetSpecies } from '../../model';
import type { FaceLayout } from '../face';
import type { PetGeometry } from '../shapes';

import { capybaraGeometry } from './capybara';
import { catGeometry } from './cat';
import { dogGeometry } from './dog';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Everything the renderer needs to draw one species. */
interface SpeciesRenderer {
  /** The body, rebuilt whenever the coat changes. */
  geometry: (appearance: PetAppearance) => PetGeometry;
  /**
   * Where this species keeps its face.
   *
   * Constant per species: a head that sits lower needs its eyes lower, but a
   * mood never moves them — that is the face builder's job.
   */
  face: FaceLayout;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The species catalogue.
 *
 * Adding one is a geometry file plus a row here — nothing else in the renderer
 * knows how many there are.
 */
const SPECIES: Record<PetSpecies, SpeciesRenderer> = {
  cat: {
    geometry: catGeometry,
    // Eyes above the muzzle pad at 178, brows clear of the ear line.
    face: {
      eyeX: 28,
      eyeY: 140,
      eyeRx: 13,
      eyeRy: 15,
      mouthY: 178,
      browY: 110,
      overlay: [214, 84],
    },
  },
  dog: {
    geometry: dogGeometry,
    // The nose sits at 168, so the mouth has to clear it.
    face: {
      eyeX: 28,
      eyeY: 142,
      eyeRx: 13,
      eyeRy: 15,
      mouthY: 192,
      browY: 112,
      overlay: [216, 86],
    },
  },
  capybara: {
    geometry: capybaraGeometry,
    // Wider skull, so the eyes sit further apart and a bit lower.
    face: {
      eyeX: 32,
      eyeY: 146,
      eyeRx: 12,
      eyeRy: 14,
      mouthY: 196,
      browY: 118,
      overlay: [220, 90],
    },
  },
};

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

export const getSpecies = (species: PetSpecies): SpeciesRenderer =>
  SPECIES[species];

export type { SpeciesRenderer };
export { capybaraGeometry, catGeometry, dogGeometry };
