// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Live knobs for framing the arena. Start as the committed constants in
 * `entities/scene/model/camera.ts` — dial here, then paste the readout back.
 *
 * Defaults are literals (not imported) so this module cannot be left
 * half-initialised by a Metro barrel cycle with `use-scene-camera`.
 */
interface CameraTune {
  /** Degrees above the floor for a room view. */
  roomElevation: number;
  /** Degrees for the overhead map view. */
  topElevation: number;
  /** Heading the map view settles on, degrees. */
  topAzimuth: number;
  /** Framing padding for a room — smaller is closer. */
  roomFit: number;
  /** Framing padding for the top view. */
  topFit: number;
  /** How far the arena sits below the look-at point, world units. */
  platformY: number;
  /** Vertical field of view, degrees. */
  fov: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Mirrors `entities/scene/model/camera.ts` — keep in sync when you paste. */
const DEFAULT_CAMERA_TUNE: CameraTune = {
  roomElevation: 13.5,
  topElevation: 30,
  topAzimuth: 315,
  roomFit: 0.47,
  topFit: 0.765,
  platformY: -120,
  fov: 45,
};

/** Sliders’ legal ranges — wide enough to find a shot, not infinite. */
const CAMERA_TUNE_RANGE = {
  roomElevation: { min: 0, max: 45, step: 0.5 },
  topElevation: { min: 12, max: 89, step: 1 },
  topAzimuth: { min: 0, max: 359, step: 5 },
  roomFit: { min: 0.35, max: 1.4, step: 0.01 },
  topFit: { min: 0.45, max: 1.6, step: 0.01 },
  platformY: { min: -280, max: 40, step: 5 },
  fov: { min: 30, max: 70, step: 1 },
} as const;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** One-line dump ready to paste into `camera.ts`. */
const formatCameraTune = (tune: CameraTune): string =>
  [
    `const TOP_ELEVATION = ${Math.round(tune.topElevation)};`,
    `const TOP_AZIMUTH = ${Math.round(tune.topAzimuth)};`,
    `const ROOM_ELEVATION = ${tune.roomElevation};`,
    `const ROOM_FIT = ${tune.roomFit.toFixed(2)};`,
    `const TOP_FIT = ${tune.topFit.toFixed(3)};`,
    `const SCENE_PLATFORM_Y = ${Math.round(tune.platformY)};`,
    `const CAMERA_FOV = ${Math.round(tune.fov)};`,
  ].join('\n');

export type { CameraTune };
export { CAMERA_TUNE_RANGE, DEFAULT_CAMERA_TUNE, formatCameraTune };
