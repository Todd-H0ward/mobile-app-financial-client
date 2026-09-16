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
  bodyDark: shade(appearance.fur, -0.28),
  bodyLight: shade(appearance.fur, 0.22),
  belly: appearance.belly,
  inner: shade(appearance.cheeks, -0.08),
  ink: '#2A231E',
  blush: appearance.cheeks,
  accent: appearance.accent,
  // Warm iris that still contrasts the coat — a flat black pupil alone reads
  // as a sticker, not as an eye.
  iris: shade(appearance.accent, -0.12),
  white: '#FFFEFA',
  shadow: '#2A231E',
});
