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
 * The cat: a pear-shaped body, a wide head, triangular ears with inner shells
 * and a long curling tail.
 *
 * Volume comes from stacking — a darker underside, a lighter belly, a soft
 * highlight on top — instead of gradients, so the shape reads at any size and
 * costs nothing to animate.
 */
export const catGeometry = (appearance: PetAppearance): PetGeometry => {
  const pattern = patternShapes(appearance);

  return {
    pivots: {
      ears: [CENTER, 118],
      tail: [214, 214],
      head: [CENTER, 150],
      eyes: [CENTER, 132],
    },
    shapes: {
      shadow: [ellipse(CENTER, 268, 74, 13, 'shadow', { opacity: 0.16 })],

      tail: [
        // A tapered comma curling up from the right hip.
        path(
          'M 196 246 C 248 250 274 206 252 168 C 244 154 224 158 230 174 C 242 200 234 226 194 230 Z',
          'bodyDark',
        ),
        // Lit edge along the outer side of the curl.
        path(
          'M 232 176 C 244 198 240 218 216 228 C 236 214 238 196 228 178 Z',
          'bodyLight',
          { opacity: 0.45 },
        ),
      ],

      body: [
        // Torso, wider at the bottom — the pear shape reads as "sitting".
        ellipse(CENTER, 214, 74, 62, 'body'),
        // Underside in shadow gives the body its volume.
        ellipse(CENTER, 236, 66, 38, 'bodyDark', { opacity: 0.55 }),
        // Belly patch.
        ellipse(CENTER, 226, 46, 36, 'belly'),
        // Hind paws.
        ellipse(112, 258, 22, 13, 'body'),
        ellipse(188, 258, 22, 13, 'body'),
        ellipse(112, 258, 14, 8, 'belly', { opacity: 0.7 }),
        ellipse(188, 258, 14, 8, 'belly', { opacity: 0.7 }),
        // Front paws, tucked together.
        ellipse(132, 250, 17, 11, 'bodyLight'),
        ellipse(168, 250, 17, 11, 'bodyLight'),
        ...pattern.body,
      ],

      ears: [
        // Tall triangles with a soft inner shell.
        path('M 100 126 L 86 62 L 152 100 z', 'body'),
        path('M 200 126 L 214 62 L 148 100 z', 'body'),
        path('M 108 118 L 98 78 L 138 102 z', 'inner'),
        path('M 192 118 L 202 78 L 162 102 z', 'inner'),
      ],

      head: [
        ellipse(CENTER, 150, 78, 68, 'body'),
        // Highlight along the top of the skull.
        ellipse(CENTER, 122, 58, 28, 'bodyLight', { opacity: 0.5 }),
        // Cheeks and muzzle pad.
        ellipse(CENTER, 178, 44, 26, 'belly'),
        ellipse(126, 172, 18, 12, 'blush', { opacity: 0.55 }),
        ellipse(174, 172, 18, 12, 'blush', { opacity: 0.55 }),
        ...pattern.head,
      ],

      eyes: [],
      overlay: [],
    },
  };
};
