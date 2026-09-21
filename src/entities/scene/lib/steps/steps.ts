import { clamp } from '@/shared/utils';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * How far a tier sits below the place the artist put it.
 *
 * A lift of `1` leaves the tier where the model has it; `0` drops it flush
 * with the bottom tier, so a room whose steps are all down reads as a flat
 * floor and the staircase grows out of it as the game raises them.
 *
 * The bottom tier never moves — it is the floor everything else sinks into.
 */
const stepOffset = (step: number, lift: number, rise: number): number =>
  -step * rise * (1 - clamp(lift, 0, 1));

/**
 * The lift each tier is heading for when `raised` of them stand up.
 *
 * Counting rather than listing is what makes "raise the next one" a single
 * increment at the call site.
 */
const liftFor = (step: number, raised: number): number =>
  step < raised ? 1 : 0;

export { liftFor, stepOffset };
