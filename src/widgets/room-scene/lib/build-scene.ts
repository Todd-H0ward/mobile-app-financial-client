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
  gearAngle,
  SCENE_FLAT_STEP,
  SCENE_PALETTE,
  SCENE_PIVOT,
  SCENE_PLATFORM_Y,
  SCENE_RADIUS,
  SCENE_SEGMENT_COUNT,
  SCENE_SHARED_SEGMENT,
  SCENE_SOURCE,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RADII,
  type SceneNode,
  terraceSinkY,
} from '@/entities/scene';
import type { WatcherAction, WatcherId } from '@/entities/watcher';

import { clamp } from '@/shared/utils';

import type { CenterCharacter } from './center-character';
import { createHazeBackdrop } from './haze-backdrop';
import { createLiftEffects, type LiftEffects } from './lift-effects';
import type { WatcherFocus, Watchers } from './watchers';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneModel {
  /** Ready to render — lights included. */
  scene: Scene;
  /** Highlights one room and mutes the other two; `null` mutes none. */
  highlight: (segment: number | null) => void;
  /**
   * Where the platform stands on its way out of the pit: `0` on the floor,
   * `1` clear of the rim. Turns the gear train to match.
   */
  setLevelProgress: (progress: number) => void;
  /** Throws dust and sparks for one level-up: the ring landing and the gears. */
  burstLift: (level: number) => void;
  /** Platform height in world units, for the camera to follow. */
  platformHeight: () => number;
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
  /** Same, for one of the two screens overhead. */
  watcherRoot: (watcher: WatcherId) => Object3D | null;
  /** Where the camera stands to talk to a screen, and what it looks at. */
  watcherFocus: (watcher: WatcherId) => WatcherFocus | null;
  /** Puts one of the screens into a state — talking, idling, reacting. */
  playWatcher: (watcher: WatcherId, action: WatcherAction) => void;
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
  // Parented to the platform further down, once the platform exists.
  const characterMount = new Group();
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

  // The overseer and the keeper, hung off the camera rig rather than the
  // arena: their own file carries the ceiling they are bolted to.
  const watcherMount = new Group();
  scene.add(watcherMount);
  let watchers: Watchers | null = null;
  let watchersDisposed = false;

  void import('./watchers')
    .then(({ attachWatchers }) => attachWatchers(watcherMount))
    .then((loaded) => {
      if (watchersDisposed) {
        loaded.dispose();
        return;
      }
      watchers = loaded;
    })
    .catch((error: unknown) => {
      console.warn('[room-scene] watchers failed to load', error);
    });

  const rooms: MeshPhongMaterial[] = [];
  const geometries: BufferGeometry[] = [];

  /**
   * The three wheels standing around the bowl — the machine that lifts the
   * floor.
   *
   * Each is its own group so it can turn about its own axle. The mesh is
   * shifted back by the wheel's centre, because a wheel turning about the
   * middle of the whole arena would swing around the bowl instead of
   * spinning where it stands.
   */
  const gears: Group[] = [];

  /** One group per terrace — the rings that merge into the floor as it rises. */
  const terraces: Group[] = [];
  for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
    const group = new Group();
    terraces.push(group);
    root.add(group);
  }

  for (let segment = 0; segment < SCENE_SEGMENT_COUNT; segment += 1) {
    const material = roomMaterial(SCENE_PALETTE.segments[segment]);
    rooms.push(material);

    // The wheel: one buffer, hung on its own axle.
    const wheelGeometry = mergeNodes(nodesOf(segment, SCENE_FLAT_STEP));
    geometries.push(wheelGeometry);

    wheelGeometry.computeBoundingSphere();
    const hub = wheelGeometry.boundingSphere?.center.clone() ?? new Vector3();
    wheelGeometry.translate(-hub.x, -hub.y, -hub.z);

    const gear = new Group();
    gear.position.copy(hub);
    gear.add(new Mesh(wheelGeometry, material));
    gears.push(gear);
    root.add(gear);

    // A terrace is a full ring across all three rooms, so it belongs to a
    // group of its own: the floor takes the rings it passes up with it, and a
    // ring split per room would be torn into three arcs at different heights.
    for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
      const geometry = mergeNodes(nodesOf(segment, terrace));
      geometries.push(geometry);
      terraces[terrace].add(new Mesh(geometry, material));
    }
  }

  /**
   * The platform: the floor the pet stands on.
   *
   * The character and the dust hang off it rather than off the arena, so the
   * whole cargo climbs together and nothing has to be moved twice.
   */
  const platform = new Group();
  root.add(platform);
  // The floor of the bowl is a flat disc at zero — the ramps around it are
  // what reach 46, not the ground the pet walks on.
  platform.add(characterMount);

  const sharedNodes = nodesOf(SCENE_SHARED_SEGMENT, SCENE_FLAT_STEP);
  const sharedMaterial = roomMaterial(SCENE_PALETTE.shared);
  if (sharedNodes.length > 0) {
    const geometry = mergeNodes(sharedNodes);
    geometries.push(geometry);
    platform.add(new Mesh(geometry, sharedMaterial));
  }

  // Mounted on the arena, not on the platform: the wheels stand out here and
  // the dust belongs to the floor the ring lands on.
  const effects: LiftEffects = createLiftEffects(
    root,
    gears.map((gear) => gear.position),
  );

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

  /** Axle of a wheel: horizontal and tangential, so it rolls around the bowl. */
  const axleOf = (gear: Group) => {
    const radial = new Vector3(gear.position.x, 0, gear.position.z);
    if (radial.lengthSq() === 0) return new Vector3(1, 0, 0);

    radial.normalize();
    return new Vector3(-radial.z, 0, radial.x);
  };

  const axles = gears.map(axleOf);

  const setLevelProgress = (progress: number) => {
    // The pit sinks around the pet rather than lifting them out of it: each
    // level swallows one more ring into the floor, and the skyline the child
    // is counting drops by one.
    terraces.forEach((terrace, index) => {
      terrace.position.y = terraceSinkY(index, progress);
    });

    gears.forEach((gear, index) => {
      gear.quaternion.setFromAxisAngle(
        axles[index],
        gearAngle(index, progress),
      );
    });
  };

  const burstLift = (level: number) => {
    // The ring that just landed is the one the level number names, and its
    // radius is where the dust has to come from.
    const landed = clamp(level - 1, 0, SCENE_TERRACE_RADII.length - 1);

    effects.burst(SCENE_TERRACE_RADII[landed]);
  };

  // World height, not the platform's own: the whole arena is offset under the
  // look-at point, and a camera aimed at the local value misses by that much.
  const platformHeight = () => root.position.y + platform.position.y;

  const tick = (timeSec: number, deltaSec: number) => {
    haze.tick(timeSec);
    character?.tick(deltaSec);
    watchers?.tick(deltaSec);
    effects.tick(deltaSec);
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
    watchersDisposed = true;
    watchers?.dispose();
    watchers = null;
    characterDisposed = true;
    character?.dispose();
    character = null;
    haze.dispose();
    effects.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of rooms) material.dispose();
    sharedMaterial.dispose();
  };

  return {
    scene,
    highlight,
    setLevelProgress,
    burstLift,
    platformHeight,
    tick,
    setCharacterSkin,
    playCharacterAction,
    reactCharacter,
    characterRoot,
    watcherRoot: (watcher) => watchers?.root(watcher) ?? null,
    watcherFocus: (watcher) => watchers?.focus(watcher) ?? null,
    playWatcher: (watcher, action) => watchers?.play(watcher, action),
    setPlatformY,
    dispose,
  };
};

export type { SceneModel };
export { buildScene };
