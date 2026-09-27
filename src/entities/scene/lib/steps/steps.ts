import { clamp } from '@/shared/utils';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** How far a tier sits below the place the artist put it. */
const stepOffset = (step: number, lift: number, rise: number): number =>
  -step * rise * (1 - clamp(lift, 0, 1));

/** The lift each tier is heading for when `raised` of them stand up. */
const liftFor = (step: number, raised: number): number =>
  step < raised ? 1 : 0;

export { liftFor, stepOffset };
