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
  /** Index into `geometries`. */
  geometry: number;
  /** Which room the node stands in, or `-1` when it sits on the axis. */
  segment: number;
  /**
   * Which tier of discs the node belongs to, `0` at the bottom, or `-1` for anything that is
   * not part of a tier.
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
  /** The discs, measured off the FBX and left out of `nodes`. */
  tiles: {
    /** One per tier, innermost first. */
    rings: SceneTileRing[];
    /** Degrees of arc one disc covers in the model. */
    cellArc: number;
    /** Degrees of arc the slot a gear stands in takes out of each ring. */
    slotArc: number;
    /** Discs in one full ring of the model, across all three bays. */
    cellsPerRing: number;
  };
  geometries: SceneGeometry[];
  nodes: SceneNode[];
}

interface SceneTileRing {
  /** Radius of the ring's inner edge — the riser the child faces. */
  inner: number;
  /** Radius of the outer edge, where the next ring starts. */
  outer: number;
  /** Height of the underside, in world units. */
  bottom: number;
  /** Height of the top face — where the numbers are drawn. */
  top: number;
  /**
   * Whether a gear stands in this ring. Only then does it keep the slot the model cut at
   * every gear; the inner rings run all the way round.
   */
  slotted: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The model, already triangulated and flattened at build time. */
const SCENE_SOURCE = source as SceneSource;

/** The scene turns around the world origin — the cloner is centred on it. */
const SCENE_PIVOT = [0, 0, 0] as const;

/** Three rooms, one per 120° wedge. */
const SCENE_SEGMENT_COUNT = SCENE_SOURCE.segmentAngles.length;

/** Nodes that belong to no single room carry this instead of an index. */
const SCENE_SHARED_SEGMENT = -1;

/** Where the three gears stand, in degrees. */
const SCENE_GEAR_ANGLES = SCENE_SOURCE.segmentAngles;

/** Where the camera stands to look into a segment, not at its back. */
const SCENE_VIEW_ANGLES = SCENE_GEAR_ANGLES.map((angle) => (angle + 180) % 360);

/** Everything fits inside this sphere around the origin. */
const SCENE_RADIUS = SCENE_SOURCE.bounds.sphereRadius;

/** Tiers of discs per room, bottom first. */
const SCENE_STEP_COUNT = SCENE_SOURCE.steps.count;

/** How far one tier stands above the one below it, in world units. */
const SCENE_STEP_RISE = SCENE_SOURCE.steps.rise;

/** Nodes that belong to no tier carry this instead of an index. */
const SCENE_FLAT_STEP = -1;

/** The rings the cells are cut from, innermost first. */
const SCENE_TILE_RINGS = SCENE_SOURCE.tiles.rings;

/** Degrees of arc a gear's slot takes out of a ring it stands in. */
const SCENE_SLOT_ARC = SCENE_SOURCE.tiles.slotArc;

export type { SceneGeometry, SceneNode, SceneSource, SceneTileRing };
export {
  SCENE_FLAT_STEP,
  SCENE_GEAR_ANGLES,
  SCENE_PIVOT,
  SCENE_RADIUS,
  SCENE_SEGMENT_COUNT,
  SCENE_SHARED_SEGMENT,
  SCENE_SLOT_ARC,
  SCENE_SOURCE,
  SCENE_STEP_COUNT,
  SCENE_STEP_RISE,
  SCENE_TILE_RINGS,
  SCENE_VIEW_ANGLES,
};
