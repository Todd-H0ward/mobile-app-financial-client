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
 * The dog: same build as the cat, but the silhouette is carried by long floppy
 * ears and a broader muzzle, and the tail is a short stub that reads as a wag.
 */
export const dogGeometry = (appearance: PetAppearance): PetGeometry => {
  const pattern = patternShapes(appearance);

  return {
    pivots: {
      ears: [CENTER, 126],
      tail: [206, 232],
      head: [CENTER, 152],
      eyes: [CENTER, 134],
    },
    shapes: {
      shadow: [ellipse(CENTER, 270, 80, 14, 'shadow', { opacity: 0.18 })],

      tail: [
        path(
          'M 196 244 C 240 252 258 222 246 194 C 242 180 224 184 230 198 C 238 218 228 232 194 232 Z',
          'bodyDark',
        ),
        ellipse(242, 196, 11, 11, 'bodyLight', { opacity: 0.6 }),
        ellipse(246, 192, 4, 4, 'white', { opacity: 0.35 }),
      ],

      body: [
        ellipse(CENTER, 216, 80, 62, 'body'),
        ellipse(CENTER, 240, 72, 38, 'bodyDark', { opacity: 0.55 }),
        ellipse(CENTER, 226, 52, 38, 'belly'),
        ellipse(116, 212, 20, 30, 'bodyLight', { opacity: 0.25, rotate: -16 }),
        ellipse(184, 212, 20, 30, 'bodyLight', { opacity: 0.25, rotate: 16 }),
        ellipse(108, 258, 25, 14, 'body'),
        ellipse(192, 258, 25, 14, 'body'),
        ellipse(108, 260, 15, 8, 'belly', { opacity: 0.75 }),
        ellipse(192, 260, 15, 8, 'belly', { opacity: 0.75 }),
        ellipse(128, 248, 19, 12, 'bodyLight'),
        ellipse(172, 248, 19, 12, 'bodyLight'),
        ...pattern.body,
      ],

      ears: [
        ellipse(78, 170, 24, 50, 'bodyDark', { rotate: 10 }),
        ellipse(222, 170, 24, 50, 'bodyDark', { rotate: -10 }),
        ellipse(80, 162, 14, 34, 'inner', { rotate: 10, opacity: 0.65 }),
        ellipse(220, 162, 14, 34, 'inner', { rotate: -10, opacity: 0.65 }),
        ellipse(76, 148, 8, 14, 'bodyLight', { rotate: 10, opacity: 0.35 }),
        ellipse(224, 148, 8, 14, 'bodyLight', { rotate: -10, opacity: 0.35 }),
      ],

      head: [
        ellipse(CENTER, 152, 76, 68, 'body'),
        ellipse(CENTER, 124, 56, 28, 'bodyLight', { opacity: 0.55 }),
        // Broad muzzle with a shiny nose.
        ellipse(CENTER, 186, 44, 28, 'belly'),
        ellipse(CENTER, 168, 14, 10, 'ink'),
        ellipse(CENTER - 3, 165, 4, 3, 'white', { opacity: 0.5 }),
        ellipse(122, 178, 19, 12, 'blush', { opacity: 0.55 }),
        ellipse(178, 178, 19, 12, 'blush', { opacity: 0.55 }),
        ...pattern.head,
      ],

      eyes: [],
      overlay: [],
    },
  };
};
