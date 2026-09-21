import { SCENE_SOURCE } from './source';

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
 * Where the camera sits once it has walked into a room.
 *
 * The artist left a camera in the scene at this angle and the terraces read
 * best from it: low enough to see the steps, high enough to see the floor.
 */
const ROOM_ELEVATION = SCENE_SOURCE.camera.elevation;

/** Clamp for a drag: below the floor there is nothing to see. */
const MIN_ELEVATION = 14;

/** Field of view, degrees, vertical. */
const CAMERA_FOV = 45;

/** Near and far planes, sized to a model roughly 1 100 units across. */
const CAMERA_NEAR = 10;
const CAMERA_FAR = 10000;

/**
 * Breathing room around the model when the camera frames it.
 *
 * A room view sits a little closer than the whole-map view: the arena is
 * tilted away from the camera there, so its silhouette is shorter.
 */
const ROOM_FIT = 0.94;
const TOP_FIT = 1.04;

export {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  MIN_ELEVATION,
  ROOM_ELEVATION,
  ROOM_FIT,
  TOP_ELEVATION,
  TOP_FIT,
};
