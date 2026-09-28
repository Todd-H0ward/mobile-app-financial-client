import { SCENE_GEAR_ANGLES } from './source';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The map view: an isometric three-quarters, not a plan. */
const TOP_ELEVATION = 36;

/**
 * Map heading: stand in a bay's middle so the opposite gear sits dead centre on
 * the far rim (`gear + 180°`).
 */
const TOP_AZIMUTH = ((SCENE_GEAR_ANGLES[0] ?? 0) + 180) % 360;

/** Level with the rim of the pit, near enough to be standing on it. */
const ROOM_ELEVATION = 13.5;

/** How far a segment shot sits from the axis, in world units. */
const SCENE_SEGMENT_DISTANCE = 1150;

/** Clamp for a drag: on the horizon there is still something to see. */
const MIN_ELEVATION = 0;

/** Field of view, degrees, vertical. */
const CAMERA_FOV = 45;

/** Near and far planes, sized to a model roughly 1 100 units across. */
const CAMERA_NEAR = 10;
const CAMERA_FAR = 10000;

/** Breathing room around the model when the camera frames it. */
/** With `SCENE_SEGMENT_DISTANCE` 1150, ≈0.46 is the phone fit that matches. */
const ROOM_FIT = 0.47;
const TOP_FIT = 0.765;

/** How far the arena sits below the look-at point, in world units. */
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
