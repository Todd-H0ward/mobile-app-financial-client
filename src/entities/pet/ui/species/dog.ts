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
      shadow: [ellipse(CENTER, 268, 76, 13, 'shadow', { opacity: 0.16 })],

      tail: [
        path(
          'M 198 244 C 236 250 254 224 244 198 C 240 186 224 188 228 200 C 234 216 226 230 196 232 Z',
          'bodyDark',
        ),
        ellipse(240, 196, 9, 9, 'bodyLight', { opacity: 0.5 }),
      ],

      body: [
        ellipse(CENTER, 216, 76, 60, 'body'),
        ellipse(CENTER, 238, 68, 36, 'bodyDark', { opacity: 0.5 }),
        ellipse(CENTER, 228, 48, 34, 'belly'),
        ellipse(110, 258, 23, 13, 'body'),
        ellipse(190, 258, 23, 13, 'body'),
        ellipse(110, 258, 15, 8, 'belly', { opacity: 0.7 }),
        ellipse(190, 258, 15, 8, 'belly', { opacity: 0.7 }),
        ellipse(130, 250, 18, 11, 'bodyLight'),
        ellipse(170, 250, 18, 11, 'bodyLight'),
        ...pattern.body,
      ],

      ears: [
        // Long ears hanging past the jaw — the dog's whole silhouette.
        ellipse(80, 168, 22, 46, 'bodyDark', { rotate: 8 }),
        ellipse(220, 168, 22, 46, 'bodyDark', { rotate: -8 }),
        ellipse(82, 160, 13, 30, 'inner', { rotate: 8, opacity: 0.55 }),
        ellipse(218, 160, 13, 30, 'inner', { rotate: -8, opacity: 0.55 }),
      ],

      head: [
        ellipse(CENTER, 152, 74, 66, 'body'),
        ellipse(CENTER, 126, 54, 26, 'bodyLight', { opacity: 0.5 }),
        // Broad muzzle with a nose on top of it.
        ellipse(CENTER, 184, 40, 26, 'belly'),
        ellipse(CENTER, 170, 11, 8, 'ink'),
        ellipse(124, 176, 17, 11, 'blush', { opacity: 0.5 }),
        ellipse(176, 176, 17, 11, 'blush', { opacity: 0.5 }),
        ...pattern.head,
      ],

      eyes: [],
      overlay: [],
    },
  };
};
