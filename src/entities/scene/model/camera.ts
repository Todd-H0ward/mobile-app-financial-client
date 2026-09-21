// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Where the camera starts: high over the model, looking down.
 *
 * Not a full 90° — at the pole the up vector and the view direction line up
 * and the image spins on its own axis as the azimuth changes.
 */
const TOP_ELEVATION = 82;

/**
 * Eye-level with the arena — on the horizon line, not the artist's tilted
 * shot in the FBX (~35°). A couple of degrees above zero keeps the floor
 * readable without tipping the camera into a top-down.
 */
const ROOM_ELEVATION = 6;

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
const ROOM_FIT = 0.72;
const TOP_FIT = 0.86;

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
  TOP_ELEVATION,
  TOP_FIT,
};
