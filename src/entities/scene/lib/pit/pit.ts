import { clamp } from '@/shared/utils';

import {
  SCENE_GEAR_TURN,
  SCENE_LEVEL_COUNT,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RISE,
} from '../../model/pit';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * How far through the climb a level is: `0` at the bottom, `1` out of the pit.
 *
 * Everything the climb moves is derived from this one number, so the game can
 * drive the whole machine with a level count that means nothing to geometry.
 */
const levelProgress = (
  level: number,
  levels: number = SCENE_LEVEL_COUNT,
): number => (levels <= 0 ? 1 : clamp(level / levels, 0, 1));

/**
 * How much of the bowl has been swallowed, in world units.
 *
 * The pit does not lift the pet out — it sinks around them. One terrace's
 * worth of depth goes per level, and rings drop into that budget from the
 * inside out.
 */
const sinkBudget = (progress: number): number =>
  clamp(progress, 0, 1) * SCENE_LEVEL_COUNT * SCENE_TERRACE_RISE;

/**
 * How far a terrace has sunk, in world units. Negative: it goes down.
 *
 * A ring stops once it is flush with the floor — it cannot sink past the
 * thing the pet is standing on. That cap is what staggers the collapse: the
 * inner rings run out of room first, so each level takes exactly one more
 * ring out of the skyline and the child counts one fewer level.
 */
const terraceSinkY = (terrace: number, progress: number): number =>
  -Math.min(
    // A ring settles flush with the floor of the bowl — the flat disc the pet
    // stands on, at zero. Stopping a step short leaves the pet in a trench;
    // going a step further leaves it on a pedestal.
    terrace * SCENE_TERRACE_RISE,
    sinkBudget(progress),
  );

/**
 * How many steps the child can still count around them.
 *
 * Rings that have sunk flush with the floor read as one step, not as several,
 * which is the whole point of the collapse.
 */
const terracesInView = (progress: number): number => {
  const tops = new Set<number>();

  for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
    const top = terrace * SCENE_TERRACE_RISE + terraceSinkY(terrace, progress);
    tops.add(Math.round(top));
  }

  return tops.size;
};

/**
 * How far a gear has turned by this point in the climb, in radians.
 *
 * The three wheels alternate direction the way meshed teeth have to. With an
 * odd number of them the ring never closes, so the third turning the same way
 * as the first is honest rather than sloppy.
 */
const gearAngle = (gear: number, progress: number): number => {
  const direction = gear % 2 === 0 ? 1 : -1;

  return direction * clamp(progress, 0, 1) * SCENE_GEAR_TURN;
};

export { gearAngle, levelProgress, sinkBudget, terraceSinkY, terracesInView };
