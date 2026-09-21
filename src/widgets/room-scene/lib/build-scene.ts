import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Scene,
  Vector3,
} from 'three';

import {
  SCENE_FLAT_STEP,
  SCENE_PALETTE,
  SCENE_PLATFORM_Y,
  SCENE_RADIUS,
  SCENE_SEGMENT_COUNT,
  SCENE_SHARED_SEGMENT,
  SCENE_SOURCE,
  SCENE_STEP_COUNT,
  SCENE_STEP_RISE,
  type SceneNode,
  stepOffset,
} from '@/entities/scene';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneModel {
  /** Ready to render — lights included. */
  scene: Scene;
  /** Highlights one room and mutes the other two; `null` mutes none. */
  highlight: (segment: number | null) => void;
  /**
   * Moves one tier of discs: `1` leaves it where the model has it, `0` drops
   * it flush with the bottom tier. Anything between is the way up.
   */
  liftStep: (segment: number, step: number, lift: number) => void;
  /** Frees every buffer the GL context is holding. */
  dispose: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Key light sits above and in front, so the wedges keep a readable top face. */
const KEY_LIGHT_POSITION = [0.6, 1, 0.45];

/** Fill comes from the opposite side at a third of the strength. */
const FILL_LIGHT_POSITION = [-0.7, 0.35, -0.6];

/**
 * Lambert adds its lights up, so the three together have to stay near 1: past
 * that the lit faces clip to white and the terraces lose their edges.
 */
const KEY_LIGHT_INTENSITY = 0.75;
const FILL_LIGHT_INTENSITY = 0.25;
const AMBIENT_INTENSITY = 0.45;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Bakes a room's nodes into one buffer.
 *
 * The model is 95 nodes over 33 shared geometries, most of them the same
 * 12-triangle disc cloned ninety times. Drawing them separately would cost 95
 * draw calls a frame for 5 400 triangles; merged, a room is a single call.
 */
const mergeNodes = (nodes: SceneNode[]): BufferGeometry => {
  const total = nodes.reduce(
    (sum, node) => sum + SCENE_SOURCE.geometries[node.geometry].position.length,
    0,
  );

  const position = new Float32Array(total);
  const normal = new Float32Array(total);
  const point = new Vector3();
  const matrix = new Matrix4();
  const normalMatrix = new Matrix3();

  let at = 0;
  for (const node of nodes) {
    const geometry = SCENE_SOURCE.geometries[node.geometry];
    matrix.fromArray(node.matrix);
    normalMatrix.getNormalMatrix(matrix);

    for (let i = 0; i < geometry.position.length; i += 3) {
      point
        .set(
          geometry.position[i],
          geometry.position[i + 1],
          geometry.position[i + 2],
        )
        .applyMatrix4(matrix)
        .toArray(position, at + i);

      point
        .set(geometry.normal[i], geometry.normal[i + 1], geometry.normal[i + 2])
        .applyMatrix3(normalMatrix)
        .normalize()
        .toArray(normal, at + i);
    }

    at += geometry.position.length;
  }

  const merged = new BufferGeometry();
  merged.setAttribute('position', new BufferAttribute(position, 3));
  merged.setAttribute('normal', new BufferAttribute(normal, 3));
  return merged;
};

const nodesOf = (segment: number, step: number): SceneNode[] =>
  SCENE_SOURCE.nodes.filter(
    (node) => node.segment === segment && node.step === step,
  );

// ═══════════════════════════════════════════
// BUILDER
// ═══════════════════════════════════════════

/**
 * The whole model as one scene: a mesh per room, plus what stands on the axis.
 *
 * Built once per GL context. Nothing here reads React state — the component
 * only moves the camera, so a re-render never rebuilds a buffer.
 */
const buildScene = (): SceneModel => {
  const scene = new Scene();
  const root = new Group();
  // Drop the arena under the look-at point so it reads in the lower half of
  // the frame at horizon elevation, not centred on the crosshair.
  root.position.y = SCENE_PLATFORM_Y;
  scene.add(root);

  const rooms: MeshLambertMaterial[] = [];
  const geometries: BufferGeometry[] = [];
  /** One group per room and tier, indexed `[segment][step]` — what moves. */
  const steps: Group[][] = [];

  for (let segment = 0; segment < SCENE_SEGMENT_COUNT; segment += 1) {
    const material = new MeshLambertMaterial({
      color: new Color(SCENE_PALETTE.segments[segment]),
      // The wedges are thin shells in places; a missing back face reads as a
      // hole in the floor.
      side: DoubleSide,
    });
    rooms.push(material);

    // The spiral is one surface with no tiers of its own: it never moves, so
    // the whole of it is a single buffer.
    const spiral = mergeNodes(nodesOf(segment, SCENE_FLAT_STEP));
    geometries.push(spiral);
    root.add(new Mesh(spiral, material));

    // A tier is its own group so the game can raise it. Its six discs are
    // merged: they always move together, and six draw calls for 72 triangles
    // would be six too many.
    steps[segment] = [];
    for (let step = 0; step < SCENE_STEP_COUNT; step += 1) {
      const geometry = mergeNodes(nodesOf(segment, step));
      geometries.push(geometry);

      const group = new Group();
      group.add(new Mesh(geometry, material));
      steps[segment][step] = group;
      root.add(group);
    }
  }

  const sharedNodes = nodesOf(SCENE_SHARED_SEGMENT, SCENE_FLAT_STEP);
  const sharedMaterial = new MeshLambertMaterial({
    color: new Color(SCENE_PALETTE.shared),
    side: DoubleSide,
  });
  if (sharedNodes.length > 0) {
    const geometry = mergeNodes(sharedNodes);
    geometries.push(geometry);
    root.add(new Mesh(geometry, sharedMaterial));
  }

  const key = new DirectionalLight(
    new Color(SCENE_PALETTE.keyLight),
    KEY_LIGHT_INTENSITY,
  );
  key.position.set(...(KEY_LIGHT_POSITION as [number, number, number]));
  key.position.multiplyScalar(SCENE_RADIUS);

  const fill = new DirectionalLight(
    new Color(SCENE_PALETTE.fillLight),
    FILL_LIGHT_INTENSITY,
  );
  fill.position.set(...(FILL_LIGHT_POSITION as [number, number, number]));
  fill.position.multiplyScalar(SCENE_RADIUS);

  scene.add(key, fill);
  scene.add(
    new AmbientLight(new Color(SCENE_PALETTE.ambientLight), AMBIENT_INTENSITY),
  );

  const highlight = (segment: number | null) => {
    rooms.forEach((material, index) => {
      const isLit = segment === null || segment === index;
      material.color.set(
        isLit
          ? SCENE_PALETTE.segments[index]
          : SCENE_PALETTE.segmentsMuted[index],
      );
    });
  };

  const liftStep = (segment: number, step: number, lift: number) => {
    const group = steps[segment]?.[step];
    if (group) group.position.y = stepOffset(step, lift, SCENE_STEP_RISE);
  };

  const dispose = () => {
    for (const geometry of geometries) geometry.dispose();
    for (const material of rooms) material.dispose();
    sharedMaterial.dispose();
  };

  return { scene, highlight, liftStep, dispose };
};

export type { SceneModel };
export { buildScene };
