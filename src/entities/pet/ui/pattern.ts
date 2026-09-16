import type { PetAppearance } from '../model/look';

import { ellipse, path, type Shape } from './shapes';

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

/**
 * Coat markings, drawn over the body and the head.
 *
 * Patterns are shapes rather than textures so they scale with the pet and cost
 * nothing to animate — they simply ride the layer they are added to. Marks are
 * big on purpose: a subtle texture fails the 2.5.2 screenshot test.
 */
export const patternShapes = (
  appearance: PetAppearance,
): { head: Shape[]; body: Shape[] } => {
  switch (appearance.pattern) {
    case 'tabby':
      return {
        head: [
          path('M 136 92 l 5 26 l 10 -3 l -6 -26 z', 'bodyDark', {
            opacity: 0.6,
          }),
          path('M 164 92 l -5 26 l -10 -3 l 6 -26 z', 'bodyDark', {
            opacity: 0.6,
          }),
          path('M 114 108 l 10 22 l 9 -5 l -11 -22 z', 'bodyDark', {
            opacity: 0.5,
          }),
          path('M 186 108 l -10 22 l -9 -5 l 11 -22 z', 'bodyDark', {
            opacity: 0.5,
          }),
        ],
        body: [
          ellipse(92, 210, 9, 22, 'bodyDark', { opacity: 0.45, rotate: 14 }),
          ellipse(208, 210, 9, 22, 'bodyDark', { opacity: 0.45, rotate: -14 }),
          ellipse(108, 230, 8, 18, 'bodyDark', { opacity: 0.35, rotate: 8 }),
          ellipse(192, 230, 8, 18, 'bodyDark', { opacity: 0.35, rotate: -8 }),
        ],
      };

    case 'patch':
      return {
        head: [
          ellipse(114, 136, 26, 24, 'bodyDark', { opacity: 0.55 }),
          ellipse(108, 128, 10, 8, 'bodyLight', { opacity: 0.25 }),
        ],
        body: [
          ellipse(198, 206, 24, 20, 'bodyDark', { opacity: 0.45 }),
          ellipse(118, 222, 16, 14, 'bodyDark', { opacity: 0.35 }),
        ],
      };

    case 'socks':
      return {
        head: [],
        body: [
          ellipse(110, 258, 20, 11, 'belly'),
          ellipse(190, 258, 20, 11, 'belly'),
          ellipse(130, 248, 16, 10, 'belly', { opacity: 0.85 }),
          ellipse(170, 248, 16, 10, 'belly', { opacity: 0.85 }),
        ],
      };

    case 'belly':
      return {
        head: [ellipse(150, 178, 36, 20, 'belly', { opacity: 0.85 })],
        body: [ellipse(150, 230, 46, 34, 'belly')],
      };

    default:
      return { head: [], body: [] };
  }
};
