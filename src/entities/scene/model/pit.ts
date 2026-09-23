// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Terraces in the bowl — the levels the child climbs.
 *
 * The model is a stepped cone: five rings, each one step taller and wider
 * than the one inside it. The pet starts on the innermost, lowest ring with
 * all five in view.
 */
const SCENE_TERRACE_COUNT = 5;

/** Height of one terrace, in world units. Read off the model. */
const SCENE_TERRACE_RISE = 40;

/**
 * Outer radius of each terrace, innermost first.
 *
 * The platform has to grow to cover what it has risen above, and these are
 * the widths it has to reach.
 */
const SCENE_TERRACE_RADII = [133, 200, 267, 333, 400];

/** Radius of the platform as the artist built it. */
const SCENE_PLATFORM_RADIUS = 267;

/**
 * Level-ups it takes to get out of the pit.
 *
 * Four, not five: the pet stands on the floor of the bowl, level with the
 * innermost ring, so it is the four rings above that have somewhere to sink.
 * When the last one lands, the pit is a plain and the pet is out of it.
 */
const SCENE_LEVEL_COUNT = 4;

/**
 * How far each gear turns per level, in radians.
 *
 * Three wheels stand upright around the bowl; they are the machine that
 * raises the floor, so they turn while it rises and stop when it stops.
 * Nearly a full turn per level — enough to read as work being done.
 */
const SCENE_GEAR_TURN = Math.PI * 1.6;

/** Seconds a single level-up takes, gears, dust and all. */
const SCENE_LIFT_SEC = 2.2;

export {
  SCENE_GEAR_TURN,
  SCENE_LEVEL_COUNT,
  SCENE_LIFT_SEC,
  SCENE_PLATFORM_RADIUS,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RADII,
  SCENE_TERRACE_RISE,
};
