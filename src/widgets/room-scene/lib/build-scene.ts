import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Matrix3,
  Matrix4,
  Mesh,
  MeshPhongMaterial,
  type Object3D,
  PointLight,
  Scene,
  SpotLight,
  Vector3,
} from 'three';

import type { RobotDogAction, RobotDogSkin } from '@/entities/robot-dog';
import {
  SCENE_FLAT_STEP,
  SCENE_PALETTE,
  SCENE_PIVOT,
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

import type { CenterCharacter } from './center-character';
import { createHazeBackdrop } from './haze-backdrop';

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
  /** Drifts the sky haze and advances the center character. */
  tick: (timeSec: number, deltaSec: number) => void;
  /**
   * Swaps the dog's coat. Every skin is the same mesh and the same clips, but
   * each lives in its own GLB, so this reloads and remounts the character.
   */
  setCharacterSkin: (skin: RobotDogSkin) => void;
  /** What the dog settles into whenever nothing interrupts it. */
  playCharacterAction: (action: RobotDogAction) => void;
  /** One-shot reaction to a tap; the dog returns to its state afterwards. */
  reactCharacter: (action: RobotDogAction, fallback: RobotDogAction) => void;
  /** What a tap ray is tested against — `null` until the model has loaded. */
  characterRoot: () => Object3D | null;
  /** Moves the arena under the look-at point (camera-rig knob). */
  setPlatformY: (y: number) => void;
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
 * Soft corridor light: warm key, cool fill, bright ambient — Smash Hit, not
 * neon alley. Flat Phong colour + mild emissive; no textures.
 */
const KEY_LIGHT_INTENSITY = 1.8;
const FILL_LIGHT_INTENSITY = 1.2;
const AMBIENT_INTENSITY = 0.85;
const HEMISPHERE_INTENSITY = 1.2;
const CENTRE_POINT_INTENSITY = 3.2;
const ROOM_POINT_INTENSITY = 2.8;
/** Soft overhead cone — sells “a lamp above the arena”, not just fill. */
const SPOT_INTENSITY = 2.8;
const SPOT_ANGLE = Math.PI / 3.5;
const SPOT_PENUMBRA = 0.7;
const SPOT_DISTANCE = 1400;

/** How high above the dropped platform the neon lamps sit. */
const POINT_LIGHT_HEIGHT = 220;

/** Radius of the three room lamps around the axis, in world units. */
const ROOM_POINT_RADIUS = SCENE_RADIUS * 0.42;

/** Longer falloff — covers the whole arena without a black rim. */
const POINT_LIGHT_DISTANCE = 1200;
const POINT_LIGHT_DECAY = 1;

const DEG_TO_RAD = Math.PI / 180;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Bakes a room's nodes into one buffer (position + normals only). */
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

const roomMaterial = (hex: string): MeshPhongMaterial =>
  new MeshPhongMaterial({
    color: new Color(hex),
    emissive: new Color(hex),
    emissiveIntensity: 0.22,
    shininess: 40,
    specular: new Color(SCENE_PALETTE.specular),
    // The wedges are thin shells in places; a missing back face reads as a
    // hole in the floor.
    side: DoubleSide,
  });

// ═══════════════════════════════════════════
// BUILDER
// ═══════════════════════════════════════════

/**
 * The whole model as one scene: a mesh per room, plus what stands on the axis.
 *
 * Built once per GL context. Nothing here reads React state — the component
 * only moves the camera, so a re-render never rebuilds a buffer.
 */
const buildScene = (skin: RobotDogSkin, action: RobotDogAction): SceneModel => {
  const scene = new Scene();
  const root = new Group();
  // Drop the arena under the look-at point so it reads in the lower half of
  // the frame at horizon elevation, not centred on the crosshair.
  root.position.y = SCENE_PLATFORM_Y;
  scene.add(root);

  // Sky sphere owns the backdrop (gradient + animated mist). No scene.fog —
  // that would wash the arena itself; haze stays on the background only.
  scene.background = null;

  const haze = createHazeBackdrop();
  scene.add(haze.mesh);

  const warnCoat = (error: unknown) => {
    console.warn('[room-scene] robot dog coat failed to load', error);
  };

  // Three and a half megabytes of robot dog — dynamic import so a missing or broken GLB
  // cannot take down the arena bundle, and so the arena paints first.
  const characterMount = new Group();
  root.add(characterMount);
  let character: CenterCharacter | null = null;
  let characterDisposed = false;
  /** Bumped on every skin swap; a load that finishes late is dropped. */
  let characterRequest = 0;
  let characterSkin = skin;
  let characterAction = action;

  const loadCharacter = () => {
    characterRequest += 1;
    const request = characterRequest;
    const loadingSkin = characterSkin;

    void import('./center-character')
      .then(({ attachCenterCharacter }) =>
        attachCenterCharacter(characterMount, loadingSkin, characterAction),
      )
      .then((loaded) => {
        if (characterDisposed || request !== characterRequest) {
          loaded.dispose();
          return;
        }
        character?.dispose();
        character = loaded;

        // The coat and the state can both change while five megabytes of dog
        // are in flight — the profile finishes loading, or the child taps a
        // tile. Whatever they settled on wins over what this load started
        // with.
        if (characterSkin !== loadingSkin) {
          void loaded.setSkin(characterSkin).catch(warnCoat);
        }
        loaded.play(characterAction);
      })
      .catch((error: unknown) => {
        console.warn('[room-scene] center character failed to load', error);
      });
  };

  loadCharacter();

  const rooms: MeshPhongMaterial[] = [];
  const geometries: BufferGeometry[] = [];
  /** One group per room and tier, indexed `[segment][step]` — what moves. */
  const steps: Group[][] = [];

  for (let segment = 0; segment < SCENE_SEGMENT_COUNT; segment += 1) {
    const material = roomMaterial(SCENE_PALETTE.segments[segment]);
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
  const sharedMaterial = roomMaterial(SCENE_PALETTE.shared);
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

  const hemisphere = new HemisphereLight(
    new Color(SCENE_PALETTE.hemisphereSky),
    new Color(SCENE_PALETTE.hemisphereGround),
    HEMISPHERE_INTENSITY,
  );

  const centre = new PointLight(
    new Color(SCENE_PALETTE.centreLight),
    CENTRE_POINT_INTENSITY,
    POINT_LIGHT_DISTANCE * 1.2,
    POINT_LIGHT_DECAY,
  );
  centre.position.set(0, SCENE_PLATFORM_Y + POINT_LIGHT_HEIGHT + 40, 0);

  // Overhead spot aimed at the pivot — a readable pool of light on the floor.
  const spot = new SpotLight(
    new Color(SCENE_PALETTE.centreLight),
    SPOT_INTENSITY,
    SPOT_DISTANCE,
    SPOT_ANGLE,
    SPOT_PENUMBRA,
    POINT_LIGHT_DECAY,
  );
  spot.position.set(0, SCENE_PLATFORM_Y + POINT_LIGHT_HEIGHT + 160, 0);
  spot.target.position.set(...SCENE_PIVOT);
  spot.target.updateMatrixWorld();

  // One neon lamp per room, parked over that wedge so the colour reads when
  // the camera faces it — and the other two stay as rim light.
  const roomLamps = SCENE_SOURCE.segmentAngles.map((angle, index) => {
    const light = new PointLight(
      new Color(SCENE_PALETTE.segments[index]),
      ROOM_POINT_INTENSITY,
      POINT_LIGHT_DISTANCE,
      POINT_LIGHT_DECAY,
    );
    const radians = angle * DEG_TO_RAD;
    light.position.set(
      Math.sin(radians) * ROOM_POINT_RADIUS,
      SCENE_PLATFORM_Y + POINT_LIGHT_HEIGHT,
      Math.cos(radians) * ROOM_POINT_RADIUS,
    );
    return light;
  });

  scene.add(key, fill, hemisphere, centre, spot, spot.target, ...roomLamps);
  scene.add(
    new AmbientLight(new Color(SCENE_PALETTE.ambientLight), AMBIENT_INTENSITY),
  );

  const highlight = (segment: number | null) => {
    rooms.forEach((material, index) => {
      const isLit = segment === null || segment === index;
      const hex = isLit
        ? SCENE_PALETTE.segments[index]
        : SCENE_PALETTE.segmentsMuted[index];
      material.color.set(hex);
      material.emissive.set(hex);
      material.emissiveIntensity = isLit ? 0.22 : 0.1;
    });

    roomLamps.forEach((lamp, index) => {
      const isLit = segment === null || segment === index;
      lamp.intensity = isLit
        ? ROOM_POINT_INTENSITY
        : ROOM_POINT_INTENSITY * 0.35;
    });
  };

  const liftStep = (segment: number, step: number, lift: number) => {
    const group = steps[segment]?.[step];
    if (group) group.position.y = stepOffset(step, lift, SCENE_STEP_RISE);
  };

  const tick = (timeSec: number, deltaSec: number) => {
    haze.tick(timeSec);
    character?.tick(deltaSec);
  };

  const setCharacterSkin = (next: RobotDogSkin) => {
    if (next === characterSkin) return;
    characterSkin = next;
    // A model still loading reconciles when it lands; one already standing
    // there only needs its textures changed.
    void character?.setSkin(next).catch(warnCoat);
  };

  const playCharacterAction = (next: RobotDogAction) => {
    characterAction = next;
    character?.play(next);
  };

  const reactCharacter = (next: RobotDogAction, fallback: RobotDogAction) => {
    character?.playOnce(next, fallback);
  };

  const characterRoot = () => character?.root ?? null;

  const setPlatformY = (y: number) => {
    root.position.y = y;
  };

  const dispose = () => {
    characterDisposed = true;
    character?.dispose();
    character = null;
    haze.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of rooms) material.dispose();
    sharedMaterial.dispose();
  };

  return {
    scene,
    highlight,
    liftStep,
    tick,
    setCharacterSkin,
    playCharacterAction,
    reactCharacter,
    characterRoot,
    setPlatformY,
    dispose,
  };
};

export type { SceneModel };
export { buildScene };
