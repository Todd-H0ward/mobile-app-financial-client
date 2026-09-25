// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The map view: an isometric three-quarters, not a plan.
 *
 * Straight down flattens the arena into a disc and hides both the terraces
 * and the two screens watching it. Thirty degrees off the floor keeps the
 * steps readable and leaves the machinery in frame.
 */
const TOP_ELEVATION = 30;

/**
 * The heading the map view always settles on.
 *
 * Fixed rather than inherited: the shot is a composition — the gears fall
 * where they fall and the watchers frame the corners — and arriving on it
 * from three different rooms would give three different pictures.
 *
 * Nudged CCW from the old 315° so the HUD boards on the near bay rim
 * sit more squarely in frame instead of tucked beside a gear.
 */
const TOP_AZIMUTH = 285;

/**
 * Level with the rim of the pit, near enough to be standing on it.
 *
 * Pasted from the camera rig at az ≈ 340 / el 13.5 / d 1150. Gears are not
 * drawn in a segment view (see `highlight` in `build-scene`) — a vertical
 * wheel reads as a floor tile stood on its edge and eats the shot.
 */
const ROOM_ELEVATION = 13.5;

/**
 * How far a segment shot sits from the axis, in world units.
 *
 * Pasted from the camera rig (d 1150). Gears drop out of a segment view;
 * this distance frames the bay and the robot without walking back into the
 * stands. The screen-fitted distance is not used for a segment — that one
 * frames the whole model, which is the map's job. `fitFor` only uses this
 * as a hard ceiling so a wide tablet cannot push the child farther out.
 */
const SCENE_SEGMENT_DISTANCE = 1150;

/** Clamp for a drag: on the horizon there is still something to see. */
const MIN_ELEVATION = 0;

/** Field of view, degrees, vertical. */
const CAMERA_FOV = 45;

/** Near and far planes, sized to a model roughly 1 100 units across. */
const CAMERA_NEAR = 10;
const CAMERA_FAR = 10000;

/**
 * Breathing room around the model when the camera frames it.
 *
 * Smaller = closer. Room view is tighter than the whole-map view so a single
 * wedge fills the phone; top still needs the full circle.
 */
/** With `SCENE_SEGMENT_DISTANCE` 1150, ≈0.46 is the phone fit that matches. */
const ROOM_FIT = 0.47;
const TOP_FIT = 0.765;

/**
 * How far the arena sits below the look-at point, in world units.
 *
 * The camera still aims at the origin; dropping the model puts the platform
 * in the lower half of the frame instead of dead-centre.
 */
const SCENE_PLATFORM_Y = -120;

export {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  MIN_ELEVATION,
  ROOM_ELEVATION,
  ROOM_FIT,
  SCENE_PLATFORM_Y,
  SCENE_SEGMENT_DISTANCE,
  TOP_AZIMUTH,
  TOP_ELEVATION,
  TOP_FIT,
};
