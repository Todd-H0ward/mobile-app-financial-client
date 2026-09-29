import {
  BoxGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from 'three';

import {
  DEFAULT_ROBOT_DOG_ACTION,
  type RobotAssembly,
  type RobotDogSkin,
} from '@/entities/robot-dog';
import {
  CAMERA_NEAR,
  SCENE_CHARACTER_FACING,
  SCENE_PALETTE,
} from '@/entities/scene';

import type { CenterCharacter } from './center-character';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RobotStageModel {
  scene: Scene;
  lens: PerspectiveCamera;
  /** Resolves once the dog stands on the stand — or failed to. */
  whenReady: Promise<void>;
  /** Buffer size in pixels. */
  setViewport: (width: number, height: number) => void;
  /**
   * The band of the view the dog should fill, as shares of its height from the top. The stand
   * runs behind the sheet, so only the band the sheet leaves open is worth framing.
   */
  setFrame: (top: number, bottom: number) => void;
  /** Turns the dog on its spot, radians from the resting three-quarter pose. */
  setYaw: (yaw: number) => void;
  setSkin: (skin: RobotDogSkin) => void;
  setAssembly: (assembly: RobotAssembly) => void;
  /** One happy bounce, then back to idle — the answer to a choice or a poke. */
  cheer: () => void;
  tick: (deltaSec: number) => void;
  dispose: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Where the lens aims: the middle of a 95-unit dog. */
const AIM_Y = 44;
const CAMERA_DISTANCE = 700;
const CAMERA_HEIGHT = 190;
const CAMERA_FOV = 30;

/** The band the dog stands in until the screen measures a real one: shares of the view height. */
const DEFAULT_FRAME = { top: 0.08, bottom: 0.42 };

/** Share of the view height the dog covers at zoom 1, measured on the running app. */
const DOG_SHARE = 0.24;

/** How much of its band the dog fills — a little air above the back and under the paws. */
const BAND_FILL = 0.78;

/** Where in its band the dog's middle stands, from the band's top. */
const CENTRE_SHARE = 0.44;

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 1.3;
const CAMERA_FAR = 3000;

/** Head towards the lens and a little to its right — the three-quarter pose of the concept. */
const RESTING_FACING = 0.5;

const FOG_NEAR = 520;
const FOG_FAR = 1900;

/** The contact shadow is an ellipse along the dog's own length. */
const SHADOW_LENGTH = 92;
const SHADOW_WIDTH = 46;
const SHADOW_OPACITY = 0.2;

const KEY_INTENSITY = 2.1;
const FILL_INTENSITY = 0.7;
const HEMISPHERE_INTENSITY = 1.35;

/** Concrete on the horizon: `[w, h, d, x, y, z, tiltZ, turnY]`. */
const SLABS: readonly (readonly number[])[] = [
  [46, 520, 46, -250, 190, -760, 0.24, 0.3],
  [340, 46, 130, 380, 14, -900, 0.04, -0.4],
  [180, 110, 110, -560, 40, -560, -0.08, 0.7],
  [120, 60, 220, 620, 20, -420, 0, 0.2],
];

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/** A small daylight set for the dog alone — setup has no arena to borrow. */
export const buildRobotStage = (
  skin: RobotDogSkin,
  assembly: RobotAssembly,
): RobotStageModel => {
  const scene = new Scene();
  scene.background = new Color(SCENE_PALETTE.stageSky);
  scene.fog = new Fog(SCENE_PALETTE.stageSky, FOG_NEAR, FOG_FAR);

  const lens = new PerspectiveCamera(CAMERA_FOV, 1, CAMERA_NEAR, CAMERA_FAR);
  lens.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
  lens.lookAt(0, AIM_Y, 0);

  const disposables: { dispose: () => void }[] = [];

  const ground = new Mesh(
    new PlaneGeometry(6000, 6000),
    new MeshLambertMaterial({ color: SCENE_PALETTE.stageGround }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  disposables.push(ground.geometry, ground.material);

  const slabMaterial = new MeshLambertMaterial({
    color: SCENE_PALETTE.stageSlab,
  });
  disposables.push(slabMaterial);
  for (const [w, h, d, x, y, z, tilt, turn] of SLABS) {
    const slab = new Mesh(new BoxGeometry(w, h, d), slabMaterial);
    slab.position.set(x, y, z);
    slab.rotation.set(0, turn, tilt);
    scene.add(slab);
    disposables.push(slab.geometry);
  }

  const key = new DirectionalLight(SCENE_PALETTE.stageKey, KEY_INTENSITY);
  key.position.set(-220, 420, 320);
  const fill = new DirectionalLight(SCENE_PALETTE.stageHemiSky, FILL_INTENSITY);
  fill.position.set(300, 160, -200);
  scene.add(
    key,
    fill,
    new HemisphereLight(
      SCENE_PALETTE.stageHemiSky,
      SCENE_PALETTE.stageHemiGround,
      HEMISPHERE_INTENSITY,
    ),
  );

  /** Turns with the dog, so the shadow stays under its length. */
  const mount = new Group();
  scene.add(mount);

  const shadowMaterial = new MeshBasicMaterial({
    color: SCENE_PALETTE.stageShadow,
    depthWrite: false,
    opacity: SHADOW_OPACITY,
    transparent: true,
  });
  const shadow = new Mesh(new CircleGeometry(1, 32), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(SHADOW_LENGTH, SHADOW_WIDTH, 1);
  shadow.position.y = 0.5;
  mount.add(shadow);
  disposables.push(shadow.geometry, shadowMaterial);

  let character: CenterCharacter | null = null;
  let isDisposed = false;
  let currentSkin = skin;
  let currentAssembly = assembly;

  const setYaw = (yaw: number) => {
    mount.rotation.y = SCENE_CHARACTER_FACING + RESTING_FACING + yaw;
  };
  setYaw(0);

  // Same dynamic import as the arena: a broken GLB leaves an empty stand, not a crash.
  const whenReady = import('./center-character')
    .then(({ attachCenterCharacter }) =>
      attachCenterCharacter(mount, currentSkin, DEFAULT_ROBOT_DOG_ACTION),
    )
    .then(async (loaded) => {
      if (isDisposed) {
        loaded.dispose();
        return;
      }
      character = loaded;
      loaded.setAssembly(currentAssembly, 'basic');
      if (currentSkin !== skin) await loaded.setSkin(currentSkin);
    })
    .catch((error: unknown) => {
      console.warn('[robot-stage] dog failed to load', error);
    });

  let viewport = { width: 1, height: 1 };
  let frame = DEFAULT_FRAME;

  /**
   * Zoom scales the dog to its band; the view offset slides the band's middle to where the dog
   * stands. A fixed band per screen means the dog never resizes when the sheet does.
   */
  const applyLens = () => {
    const { width, height } = viewport;
    const band = Math.max(frame.bottom - frame.top, 0.05);
    // A little above the middle: the lens looks down, so the paws and the shadow sit low.
    const centre = frame.top + band * CENTRE_SHARE;
    lens.aspect = width / height;
    lens.zoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, (band * BAND_FILL) / DOG_SHARE),
    );
    lens.setViewOffset(
      width,
      height,
      0,
      (0.5 - centre) * height,
      width,
      height,
    );
    lens.updateProjectionMatrix();
  };

  return {
    scene,
    lens,
    whenReady,
    setViewport: (width, height) => {
      viewport = { width, height };
      applyLens();
    },
    setFrame: (top, bottom) => {
      frame = { top, bottom };
      applyLens();
    },
    setYaw,
    setSkin: (next) => {
      if (next === currentSkin) return;
      currentSkin = next;
      void character?.setSkin(next).catch((error: unknown) => {
        console.warn('[robot-stage] coat failed to load', error);
      });
    },
    setAssembly: (next) => {
      currentAssembly = next;
      character?.setAssembly(next, 'basic');
    },
    cheer: () => character?.playOnce('joy', DEFAULT_ROBOT_DOG_ACTION),
    tick: (deltaSec) => character?.tick(deltaSec),
    dispose: () => {
      isDisposed = true;
      character?.dispose();
      character = null;
      for (const entry of disposables) entry.dispose();
    },
  };
};

export type { RobotStageModel };
