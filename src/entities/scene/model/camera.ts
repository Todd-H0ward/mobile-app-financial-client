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
 */
const TOP_AZIMUTH = 315;

/**
 * Level with the rim of the pit, near enough to be standing on it.
 *
 * True horizon — a couple of degrees — cannot work from outside the arena:
 * the rim is 160 units tall at a radius of 400, so anything flatter than
 * 21.8° is a view of the back of a wall with the robot behind it. What makes
 * the shot read as eye-level instead of a map is the distance, not the
 * angle: `SCENE_SEGMENT_DISTANCE` brings the camera in over its own wedge,
 * where the terraces step down and away and the robot is in the open.
 */
const ROOM_ELEVATION = 24;

/**
 * How far a segment shot sits from the axis, in world units.
 *
 * Far enough back that the bay reads as a wall. Its six cells wrap 120° of
 * the ring, so from close in the two ends loom over the camera and the
 * middle falls away — five rows of six turn into a pair of wings. Distance
 * flattens the arc; 1500 is where it stops being a bowl and starts being a
 * board, with the robot still large enough to read in front of it.
 *
 * The near side never gets in the way at any distance, because it is not
 * drawn: a segment view renders its own bay and hides the other two with the
 * gears (see `highlight`). That is what lets the camera sit down at eye
 * level, which is where a child stands.
 *
 * The screen-fitted distance is not used for a segment — that one frames the
 * whole model, which is the map's job.
 */
const SCENE_SEGMENT_DISTANCE = 1500;

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
const ROOM_FIT = 0.66;
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
