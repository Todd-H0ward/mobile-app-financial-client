import source from '@/assets/scene/scene.json';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneGeometry {
  /** Triangle soup in the geometry's own space, `x, y, z` per vertex. */
  position: number[];
  /** One normal per position, same length and order. */
  normal: number[];
}

interface SceneNode {
  /** Index into `geometries` — 90 of the 95 nodes are cloned discs. */
  geometry: number;
  /** Which room the node stands in, or `-1` when it sits on the axis. */
  segment: number;
  /**
   * Which tier of discs the node belongs to, `0` at the bottom, or `-1` for
   * anything that is not part of a tier — the spiral itself, above all.
   */
  step: number;
  /** World matrix, column-major, 16 numbers — the same layout three uses. */
  matrix: number[];
}

interface SceneSource {
  /** The FBX this was generated from; regenerate with `scripts/fbx-to-scene.mjs`. */
  source: string;
  fbxVersion: number;
  /** World-space extent of every triangle, in C4D units (≈ centimetres). */
  bounds: {
    min: number[];
    max: number[];
    center: number[];
    radius: number;
    /** Radius of the sphere around the origin that holds every vertex. */
    sphereRadius: number;
  };
  /** The camera the artist left in the scene — our framing starts from it. */
  camera: {
    /** Degrees above the floor. */
    elevation: number;
    /** Distance from the origin, in world units. */
    distance: number;
  };
  /** Azimuth of each room around Y, in degrees, ascending. */
  segmentAngles: number[];
  /** The tiers of discs — the only part of the model built to move. */
  steps: {
    count: number;
    /** Distance between two tiers, in world units. */
    rise: number;
  };
  geometries: SceneGeometry[];
  nodes: SceneNode[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The model, already triangulated and flattened at build time.
 *
 * The app ships no FBX loader: the geometry never changes at runtime, so
 * `scripts/fbx-to-scene.mjs` bakes it into JSON that Metro can inline.
 */
const SCENE_SOURCE = source as SceneSource;

/** The scene turns around the world origin — the cloner is centred on it. */
const SCENE_PIVOT = [0, 0, 0] as const;

/** Three rooms, one per 120° wedge. */
const SCENE_SEGMENT_COUNT = SCENE_SOURCE.segmentAngles.length;

/** Nodes that belong to no single room carry this instead of an index. */
const SCENE_SHARED_SEGMENT = -1;

/**
 * Where the three gears stand, in degrees.
 *
 * The model's own headings, untouched. Each ring of tiles has a slot cut in
 * it at each of these, the gear sits in the slot, and a ramp climbs through
 * it — so these are the **edges** of the segments, never their middles.
 * Measure anything about a segment from here.
 */
const SCENE_GEAR_ANGLES = SCENE_SOURCE.segmentAngles;

/**
 * Where the camera stands to look **into** a segment, not at its back.
 *
 * Half a turn from the gears, and kept only because so much already reads
 * it. It is a camera heading, not a feature of the model: adding 180 here is
 * exactly the trap that put a gear in the middle of every segment and the
 * camera inside the bay it was meant to be facing. Group tiles with
 * `SCENE_GEAR_ANGLES`.
 */
const SCENE_VIEW_ANGLES = SCENE_GEAR_ANGLES.map((angle) => (angle + 180) % 360);

/** Everything fits inside this sphere around the origin. */
const SCENE_RADIUS = SCENE_SOURCE.bounds.sphereRadius;

/**
 * Tiers of discs per room, bottom first.
 *
 * These are the steps the game raises one at a time. The spiral they climb is
 * a single surface in the model — it has no tiers of its own and cannot be
 * taken apart without reworking the art.
 */
const SCENE_STEP_COUNT = SCENE_SOURCE.steps.count;

/** How far one tier stands above the one below it, in world units. */
const SCENE_STEP_RISE = SCENE_SOURCE.steps.rise;

/** Nodes that belong to no tier carry this instead of an index. */
const SCENE_FLAT_STEP = -1;

export type { SceneGeometry, SceneNode, SceneSource };
export {
  SCENE_FLAT_STEP,
  SCENE_GEAR_ANGLES,
  SCENE_PIVOT,
  SCENE_RADIUS,
  SCENE_SEGMENT_COUNT,
  SCENE_SHARED_SEGMENT,
  SCENE_SOURCE,
  SCENE_STEP_COUNT,
  SCENE_STEP_RISE,
  SCENE_VIEW_ANGLES,
};
