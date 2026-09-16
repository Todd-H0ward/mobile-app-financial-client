import { shade } from '@/shared/utils';

import type { PetAppearance } from '../model/look';

import type { FillSlot } from './shapes';

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

/**
 * Resolves the colour slots for one pet.
 *
 * Shades are derived from the coat so a new fur colour needs no new artwork:
 * the darker tone carves the underside, the lighter one lifts the top, and the
 * inner tone lines the ears.
 */
export const buildPalette = (
  appearance: PetAppearance,
): Record<FillSlot, string> => ({
  body: appearance.fur,
  bodyDark: shade(appearance.fur, -0.22),
  bodyLight: shade(appearance.fur, 0.16),
  belly: appearance.belly,
  inner: shade(appearance.cheeks, -0.05),
  ink: '#3F332C',
  blush: appearance.cheeks,
  accent: appearance.accent,
  white: '#FFFFFF',
  shadow: '#3F332C',
});
