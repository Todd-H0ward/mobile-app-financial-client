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
 * Volume comes from stacking — darker underside, lighter crown, cheek fluff
 * and whiskers — so it reads as a soft animal rather than a flat sticker.
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
      shadow: [ellipse(CENTER, 270, 78, 14, 'shadow', { opacity: 0.18 })],

      tail: [
        path(
          'M 196 246 C 252 252 278 204 254 164 C 246 150 224 154 232 172 C 246 200 236 228 194 230 Z',
          'bodyDark',
        ),
        path(
          'M 234 174 C 248 196 244 218 218 228 C 240 214 242 196 230 176 Z',
          'bodyLight',
          { opacity: 0.55 },
        ),
        ellipse(248, 168, 10, 10, 'bodyLight', { opacity: 0.65 }),
      ],

      body: [
        ellipse(CENTER, 214, 78, 64, 'body'),
        ellipse(CENTER, 238, 70, 40, 'bodyDark', { opacity: 0.58 }),
        ellipse(CENTER, 224, 50, 40, 'belly'),
        // Soft flank highlight.
        ellipse(118, 210, 18, 28, 'bodyLight', { opacity: 0.28, rotate: -18 }),
        ellipse(182, 210, 18, 28, 'bodyLight', { opacity: 0.28, rotate: 18 }),
        // Hind paws.
        ellipse(110, 258, 24, 14, 'body'),
        ellipse(190, 258, 24, 14, 'body'),
        ellipse(110, 260, 14, 8, 'belly', { opacity: 0.75 }),
        ellipse(190, 260, 14, 8, 'belly', { opacity: 0.75 }),
        // Front paws, tucked together.
        ellipse(130, 248, 18, 12, 'bodyLight'),
        ellipse(170, 248, 18, 12, 'bodyLight'),
        ellipse(130, 250, 8, 5, 'blush', { opacity: 0.35 }),
        ellipse(170, 250, 8, 5, 'blush', { opacity: 0.35 }),
        ...pattern.body,
      ],

      ears: [
        path('M 98 128 L 82 56 L 154 98 z', 'body'),
        path('M 202 128 L 218 56 L 146 98 z', 'body'),
        path('M 106 118 L 94 74 L 140 100 z', 'inner'),
        path('M 194 118 L 206 74 L 160 100 z', 'inner'),
        // Lit rim on the outer ear edge.
        path('M 90 90 L 86 64 L 112 88 z', 'bodyLight', { opacity: 0.4 }),
        path('M 210 90 L 214 64 L 188 88 z', 'bodyLight', { opacity: 0.4 }),
      ],

      head: [
        ellipse(CENTER, 150, 80, 70, 'body'),
        ellipse(CENTER, 120, 60, 30, 'bodyLight', { opacity: 0.55 }),
        // Cheek fluff — the cat's soft outline.
        ellipse(104, 168, 22, 18, 'body'),
        ellipse(196, 168, 22, 18, 'body'),
        ellipse(CENTER, 180, 46, 28, 'belly'),
        // Soft triangle nose between the eyes and the muzzle.
        path('M 150 158 L 160 170 L 140 170 Z', 'ink'),
        ellipse(148, 162, 3, 2.5, 'white', { opacity: 0.5 }),
        ellipse(122, 174, 20, 13, 'blush', { opacity: 0.55 }),
        ellipse(178, 174, 20, 13, 'blush', { opacity: 0.55 }),
        // Whiskers.
        path('M 78 168 L 118 174', 'ink', { opacity: 0.35 }),
        path('M 76 178 L 118 178', 'ink', { opacity: 0.3 }),
        path('M 80 188 L 120 182', 'ink', { opacity: 0.3 }),
        path('M 222 168 L 182 174', 'ink', { opacity: 0.35 }),
        path('M 224 178 L 182 178', 'ink', { opacity: 0.3 }),
        path('M 220 188 L 180 182', 'ink', { opacity: 0.3 }),
        ...pattern.head,
      ],

      eyes: [],
      overlay: [],
    },
  };
};
