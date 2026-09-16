import type { PetAppearance } from '../../model';
import { patternShapes } from '../pattern';
import { CANVAS, ellipse, type PetGeometry, path } from '../shapes';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CENTER = CANVAS / 2;

// ═══════════════════════════════════════════
// GEOMETRY
// ═══════════════════════════════════════════

/**
 * The capybara: blunt and rectangular where the others are round, with a heavy
 * muzzle, tiny ears and no tail. The silhouette does the recognising.
 */
export const capybaraGeometry = (appearance: PetAppearance): PetGeometry => {
  const pattern = patternShapes(appearance);

  return {
    pivots: {
      ears: [CENTER, 108],
      tail: [CENTER, 240],
      head: [CENTER, 156],
      eyes: [CENTER, 140],
    },
    shapes: {
      shadow: [ellipse(CENTER, 270, 86, 14, 'shadow', { opacity: 0.18 })],

      tail: [],

      body: [
        path(
          'M 70 256 q -8 -74 80 -74 q 88 0 80 74 q -2 14 -20 14 l -120 0 q -18 0 -20 -14 z',
          'body',
        ),
        ellipse(CENTER, 248, 74, 24, 'bodyDark', { opacity: 0.5 }),
        ellipse(CENTER, 232, 50, 32, 'belly'),
        ellipse(110, 220, 16, 26, 'bodyLight', { opacity: 0.22, rotate: -12 }),
        ellipse(190, 220, 16, 26, 'bodyLight', { opacity: 0.22, rotate: 12 }),
        ellipse(110, 258, 24, 13, 'bodyLight'),
        ellipse(190, 258, 24, 13, 'bodyLight'),
        ...pattern.body,
      ],

      ears: [
        ellipse(94, 114, 16, 14, 'bodyDark'),
        ellipse(206, 114, 16, 14, 'bodyDark'),
        ellipse(94, 116, 9, 8, 'inner', { opacity: 0.7 }),
        ellipse(206, 116, 9, 8, 'inner', { opacity: 0.7 }),
      ],

      head: [
        path(
          'M 78 154 q 0 -48 72 -48 q 72 0 72 48 q 0 54 -72 54 q -72 0 -72 -54 z',
          'body',
        ),
        ellipse(CENTER, 126, 56, 22, 'bodyLight', { opacity: 0.5 }),
        // The heavy muzzle a capybara is all about.
        ellipse(CENTER, 188, 50, 26, 'belly'),
        ellipse(CENTER, 172, 16, 10, 'ink'),
        ellipse(CENTER - 4, 169, 4, 3, 'white', { opacity: 0.45 }),
        // Nostrils.
        ellipse(142, 180, 3.5, 2.5, 'ink', { opacity: 0.55 }),
        ellipse(158, 180, 3.5, 2.5, 'ink', { opacity: 0.55 }),
        ellipse(118, 182, 18, 11, 'blush', { opacity: 0.5 }),
        ellipse(182, 182, 18, 11, 'blush', { opacity: 0.5 }),
        ...pattern.head,
      ],

      eyes: [],
      overlay: [],
    },
  };
};
