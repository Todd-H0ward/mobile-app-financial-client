// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Terraces in the bowl — the levels the child climbs. */
const SCENE_TERRACE_COUNT = 5;

/** Height of one terrace, in world units. Read off the model. */
const SCENE_TERRACE_RISE = 40;

/** Outer radius of each terrace, innermost first. */
const SCENE_TERRACE_RADII = [133, 200, 267, 333, 400];

/** Radius of the platform as the artist built it. */
const SCENE_PLATFORM_RADIUS = 267;

/** Five progression stages; geometry must represent the full game progression. */
const SCENE_LEVEL_COUNT = 5;

/** How far each gear turns per level, in radians. */
const SCENE_GEAR_TURN = Math.PI * 1.6;

/** Which way the robot's own model faces, in radians, before it is turned. */
const SCENE_CHARACTER_FACING = Math.PI / 2;

/** Seconds a single level-up takes, gears, dust and all. */
const SCENE_LIFT_SEC = 2.2;

export {
  SCENE_CHARACTER_FACING,
  SCENE_GEAR_TURN,
  SCENE_LEVEL_COUNT,
  SCENE_LIFT_SEC,
  SCENE_PLATFORM_RADIUS,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RADII,
  SCENE_TERRACE_RISE,
};
