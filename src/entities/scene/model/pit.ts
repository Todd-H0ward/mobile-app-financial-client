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

/** How far each gear turns over the whole climb, in radians. */
const SCENE_GEAR_TURN = Math.PI * 1.6;

/** Radius of a gear to the tips of its teeth, in world units. Read off the model. */
const SCENE_GEAR_RADIUS = 160;

/** Radius at which a gear's teeth meet the rack in its column, in world units. Read off the model. */
const SCENE_GEAR_PITCH_RADIUS = 150;

/** Teeth on one wheel. Read off the model. */
const SCENE_GEAR_TEETH = 13;

/**
 * Where the tooth nearest the rack stands at rest, in radians up from the outward radial.
 * Read off the model; the rack's gaps are laid out from it so the two mesh.
 */
const SCENE_GEAR_TOOTH_PHASE = 0.1165;

/** Which way the robot's own model faces, in radians, before it is turned. */
const SCENE_CHARACTER_FACING = Math.PI / 2;

/** Seconds a single level-up takes, gears, dust and all. */
const SCENE_LIFT_SEC = 2.2;

export {
  SCENE_CHARACTER_FACING,
  SCENE_GEAR_PITCH_RADIUS,
  SCENE_GEAR_RADIUS,
  SCENE_GEAR_TEETH,
  SCENE_GEAR_TOOTH_PHASE,
  SCENE_GEAR_TURN,
  SCENE_LEVEL_COUNT,
  SCENE_LIFT_SEC,
  SCENE_PLATFORM_RADIUS,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RADII,
  SCENE_TERRACE_RISE,
};
