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
      shadow: [ellipse(CENTER, 268, 82, 13, 'shadow', { opacity: 0.16 })],

      tail: [],

      body: [
        // Stocky, almost square body.
        path(
          'M 74 254 q -6 -70 76 -70 q 82 0 76 70 q -2 12 -18 12 l -116 0 q -16 0 -18 -12 z',
          'body',
        ),
        ellipse(CENTER, 246, 70, 22, 'bodyDark', { opacity: 0.45 }),
        ellipse(CENTER, 234, 46, 28, 'belly'),
        ellipse(112, 256, 22, 12, 'bodyLight'),
        ellipse(188, 256, 22, 12, 'bodyLight'),
        ...pattern.body,
      ],

      ears: [
        ellipse(96, 116, 15, 13, 'bodyDark'),
        ellipse(204, 116, 15, 13, 'bodyDark'),
        ellipse(96, 117, 8, 7, 'inner', { opacity: 0.6 }),
        ellipse(204, 117, 8, 7, 'inner', { opacity: 0.6 }),
      ],

      head: [
        // Wide, low-set head with a flat top.
        path(
          'M 82 154 q 0 -46 68 -46 q 68 0 68 46 q 0 52 -68 52 q -68 0 -68 -52 z',
          'body',
        ),
        ellipse(CENTER, 128, 52, 20, 'bodyLight', { opacity: 0.45 }),
        // The heavy muzzle a capybara is all about.
        ellipse(CENTER, 186, 46, 24, 'belly'),
        ellipse(CENTER, 174, 13, 8, 'ink'),
        ellipse(120, 180, 16, 10, 'blush', { opacity: 0.45 }),
        ellipse(180, 180, 16, 10, 'blush', { opacity: 0.45 }),
        ...pattern.head,
      ],

      eyes: [],
      overlay: [],
    },
  };
};
