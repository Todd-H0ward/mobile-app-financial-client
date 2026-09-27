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

/** How far through the climb a level is: `0` at the bottom, `1` out of the pit. */
const levelProgress = (
  level: number,
  levels: number = SCENE_LEVEL_COUNT,
): number => (levels <= 0 ? 1 : clamp(level / levels, 0, 1));

/** How much of the bowl has been swallowed, in world units. */
const sinkBudget = (progress: number): number =>
  Math.min(clamp(progress, 0, 1) * SCENE_LEVEL_COUNT, SCENE_TERRACE_COUNT - 1) *
  SCENE_TERRACE_RISE;

/** How many steps have settled flush with the platform, `0 … 4`. */
const flushSteps = (progress: number): number =>
  Math.floor(sinkBudget(progress) / SCENE_TERRACE_RISE + 1e-6);

/** How far a terrace has sunk, in world units. Negative: it goes down. */
const terraceSinkY = (terrace: number, progress: number): number =>
  -Math.min(
    // A ring settles flush with the floor of the bowl — the flat disc the robot stands on, at zero. Stopping a step short leaves the robot in a trench; going a step further leaves it on a pedestal.
    terrace * SCENE_TERRACE_RISE,
    sinkBudget(progress),
  );

/** How many steps the child can still count around them. */
const terracesInView = (progress: number): number => {
  const tops = new Set<number>();

  for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
    const top = terrace * SCENE_TERRACE_RISE + terraceSinkY(terrace, progress);
    tops.add(Math.round(top));
  }

  return tops.size;
};

/** How far a gear has turned by this point in the climb, in radians. */
const gearAngle = (gear: number, progress: number): number => {
  const direction = gear % 2 === 0 ? 1 : -1;

  return direction * clamp(progress, 0, 1) * SCENE_GEAR_TURN;
};

export {
  flushSteps,
  gearAngle,
  levelProgress,
  sinkBudget,
  terraceSinkY,
  terracesInView,
};
