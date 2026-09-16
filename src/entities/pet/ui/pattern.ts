import type { PetAppearance } from '../model/look';

import { ellipse, path, type Shape } from './shapes';

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

/**
 * Coat markings, drawn over the body and the head.
 *
 * Patterns are shapes rather than textures so they scale with the pet and cost
 * nothing to animate — they simply ride the layer they are added to.
 */
export const patternShapes = (
  appearance: PetAppearance,
): { head: Shape[]; body: Shape[] } => {
  switch (appearance.pattern) {
    case 'tabby':
      return {
        head: [
          path('M 138 96 l 4 22 l 8 -2 l -5 -22 z', 'bodyDark', {
            opacity: 0.5,
          }),
          path('M 158 96 l -4 22 l -8 -2 l 5 -22 z', 'bodyDark', {
            opacity: 0.5,
          }),
          path('M 118 110 l 8 18 l 7 -4 l -9 -18 z', 'bodyDark', {
            opacity: 0.4,
          }),
          path('M 182 110 l -8 18 l -7 -4 l 9 -18 z', 'bodyDark', {
            opacity: 0.4,
          }),
        ],
        body: [
          ellipse(96, 214, 7, 17, 'bodyDark', { opacity: 0.35, rotate: 12 }),
          ellipse(204, 214, 7, 17, 'bodyDark', { opacity: 0.35, rotate: -12 }),
        ],
      };

    case 'patch':
      return {
        head: [ellipse(118, 138, 22, 20, 'bodyDark', { opacity: 0.45 })],
        body: [ellipse(196, 208, 20, 16, 'bodyDark', { opacity: 0.35 })],
      };

    case 'socks':
      return {
        head: [],
        body: [
          ellipse(112, 258, 18, 10, 'belly'),
          ellipse(188, 258, 18, 10, 'belly'),
        ],
      };

    case 'belly':
      return {
        head: [],
        body: [ellipse(150, 232, 40, 28, 'belly', { opacity: 0.9 })],
      };

    default:
      return { head: [], body: [] };
  }
};
