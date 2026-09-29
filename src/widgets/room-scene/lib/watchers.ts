import {
  type AnimationAction,
  AnimationMixer,
  Box3,
  Group,
  type Mesh,
  MeshStandardMaterial,
  type Object3D,
  Quaternion,
  type Texture,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { TOP_AZIMUTH } from '@/entities/scene';
import {
  DEFAULT_WATCHER_ACTION,
  WATCHER_ACTIONS,
  WATCHER_CLIP_WEIGHT,
  WATCHER_CLIPS,
  WATCHER_FADE_SEC,
  WATCHER_FOCUS_AIM_DOWN,
  WATCHER_FOCUS_DISTANCE,
  WATCHER_FOCUS_LIFT,
  WATCHER_HIDDEN_MATERIALS,
  WATCHER_IDS,
  WATCHER_PITCH,
  WATCHER_PLACEMENT,
  WATCHER_SCALE,
  WATCHER_YAW,
  type WatcherAction,
  type WatcherId,
} from '@/entities/watcher';

import { loadGlTexture, readAssetBytes } from './local-asset';
import { animateWatcherFace, type WatcherFace } from './watcher-face';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Watchers {
  tick: (deltaSec: number, isAnimated: boolean) => void;
  play: (watcher: WatcherId, action: WatcherAction) => void;
  /** Tap target; `null` until loaded. */
  root: (watcher: WatcherId) => Object3D | null;
  /** Shot from the live face mesh, not bind-pose placement. */
  focus: (watcher: WatcherId) => WatcherFocus | null;
  /** Raise focused machine for the terminal; `null` restores map height. */
  setLifted: (watcher: WatcherId | null) => void;
  /** Hide on segment views; show on the map. */
  setVisible: (isVisible: boolean) => void;
  dispose: () => void;
}

interface WatcherFocus {
  anchor: Vector3;
  eye: Vector3;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Relative `require` — `@/*` does not reach `assets/`. */
const WATCHER_MODELS: Record<WatcherId, number> = {
  overseer: require('../../../../assets/scene/watchers/overseer.glb') as number,
  keeper: require('../../../../assets/scene/watchers/keeper.glb') as number,
};

/** Face texture per clip — must swap with the action or anger keeps an idle face. */
const WATCHER_SCREENS: Record<WatcherId, Record<WatcherAction, number>> = {
  overseer: {
    idle: require('../../../../assets/scene/watchers/screens/overseer/idle.png') as number,
    talk: require('../../../../assets/scene/watchers/screens/overseer/talk.png') as number,
    react:
      require('../../../../assets/scene/watchers/screens/overseer/react.png') as number,
    rest: require('../../../../assets/scene/watchers/screens/overseer/rest.png') as number,
  },
  keeper: {
    idle: require('../../../../assets/scene/watchers/screens/keeper/idle.png') as number,
    talk: require('../../../../assets/scene/watchers/screens/keeper/talk.png') as number,
    react:
      require('../../../../assets/scene/watchers/screens/keeper/react.png') as number,
    rest: require('../../../../assets/scene/watchers/screens/keeper/rest.png') as number,
  },
};

const SCREEN_MATERIAL = 'Screen';

/** Cap metalness — no env map, so 1.0 reads as black silhouette. */
const MAX_METALNESS = 0.3;

const SCREEN_GLOW = 1.1;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Face texture — flipped: without it the smile reads as a frown under expo-gl. */
const loadFace = (module: number): Promise<Texture> =>
  loadGlTexture(module, { isFlipped: true });

/** Tone down PBR for this scene's lights; emissive face on `Screen`. */
const dress = (root: Object3D, face: Texture): MeshStandardMaterial | null => {
  let screen: MeshStandardMaterial | null = null;

  root.traverse((object) => {
    const material = (object as Mesh).material;
    if (!material) return;

    for (const entry of Array.isArray(material) ? material : [material]) {
      if (WATCHER_HIDDEN_MATERIALS.includes(entry.name)) {
        object.visible = false;
        continue;
      }

      if (!(entry instanceof MeshStandardMaterial)) continue;

      entry.normalMap = null;
      entry.roughnessMap = null;
      entry.metalnessMap = null;
      entry.metalness = Math.min(entry.metalness, MAX_METALNESS);

      if (entry.name === SCREEN_MATERIAL) {
        entry.map = face;
        entry.emissiveMap = face;
        entry.emissive.setScalar(SCREEN_GLOW);
        entry.toneMapped = false;
        screen = entry;
      }

      entry.needsUpdate = true;
    }
  });

  return screen;
};

const disposeTree = (root: Object3D) => {
  root.traverse((object) => {
    const mesh = object as Mesh;
    mesh.geometry?.dispose();

    const material = mesh.material;
    if (!material) return;
    for (const entry of Array.isArray(material) ? material : [material]) {
      entry.dispose();
    }
  });
};

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/** Hang both watchers in world space, aligned to the overhead map (`TOP_AZIMUTH`). */
const attachWatchers = async (mount: Group): Promise<Watchers> => {
  const rig = new Group();
  rig.rotation.y = (TOP_AZIMUTH * Math.PI) / 180;
  mount.add(rig);

  const loader = new GLTFLoader();
  const mixers = new Map<WatcherId, AnimationMixer>();
  const clips = new Map<WatcherId, Map<WatcherAction, AnimationAction>>();
  const current = new Map<WatcherId, AnimationAction>();
  const roots: Object3D[] = [];
  const pivots = new Map<WatcherId, Group>();
  const faces = new Map<WatcherId, Object3D>();
  const screens = new Map<WatcherId, MeshStandardMaterial>();
  const looks = new Map<WatcherId, Map<WatcherAction, Texture>>();
  const animatedFaces = new Map<WatcherId, WatcherFace>();

  const play = (watcher: WatcherId, action: WatcherAction) => {
    // Swap the face even when this action has no clip.
    const look = looks.get(watcher)?.get(action);
    const screen = screens.get(watcher);
    if (look && screen && screen.map !== look) {
      screen.map = look;
      screen.emissiveMap = look;
      screen.needsUpdate = true;
      animatedFaces.get(watcher)?.setAction(action);
    }

    const next = clips.get(watcher)?.get(action);
    if (!next || next === current.get(watcher)) return;

    next.reset().fadeIn(WATCHER_FADE_SEC).play();
    current.get(watcher)?.fadeOut(WATCHER_FADE_SEC);
    current.set(watcher, next);
  };

  await Promise.all(
    WATCHER_IDS.map(async (watcher) => {
      const [buffer, faceList] = await Promise.all([
        readAssetBytes(WATCHER_MODELS[watcher]),
        Promise.all(
          WATCHER_ACTIONS.map(async (action) =>
            loadFace(WATCHER_SCREENS[watcher][action]),
          ),
        ),
      ]);

      const look = new Map<WatcherAction, Texture>();
      WATCHER_ACTIONS.forEach((action, index) => {
        look.set(action, faceList[index]);
      });
      looks.set(watcher, look);

      const gltf = await loader.parseAsync(buffer, '');
      const root = gltf.scene;

      const screenMaterial = dress(root, faceList[0]);
      if (screenMaterial) {
        screens.set(watcher, screenMaterial);
        animatedFaces.set(watcher, animateWatcherFace(screenMaterial, watcher));
      }
      root.scale.setScalar(WATCHER_SCALE[watcher]);

      // Pivot on the face, not the artist's bracket origin.
      const screen =
        root.getObjectByName('Screen') ?? root.getObjectByName('Head') ?? root;
      const box = new Box3().setFromObject(screen);
      const centre = new Vector3();
      box.getCenter(centre);

      const spot = WATCHER_PLACEMENT[watcher];
      const pivot = new Group();
      pivot.position.set(spot.x, spot.y, spot.z);
      // YXZ: yaw toward the dog, then pitch down at its chest.
      pivot.rotation.order = 'YXZ';
      pivot.rotation.y = (WATCHER_YAW[watcher] * Math.PI) / 180;
      pivot.rotation.x = (WATCHER_PITCH[watcher] * Math.PI) / 180;
      root.position.set(-centre.x, -centre.y, -centre.z);
      pivot.add(root);

      rig.add(pivot);
      pivots.set(watcher, pivot);
      faces.set(watcher, screen);
      roots.push(root);

      const mixer = new AnimationMixer(root);
      mixers.set(watcher, mixer);

      const actions = new Map<WatcherAction, AnimationAction>();
      for (const [action, name] of Object.entries(WATCHER_CLIPS[watcher])) {
        const clip = gltf.animations.find((entry) => entry.name === name);
        if (!clip) continue;
        const played = mixer.clipAction(clip);
        // Weight dampens the shipped sway — fadeIn still ramps up to this, not to 1.
        played.weight = WATCHER_CLIP_WEIGHT;
        actions.set(action as WatcherAction, played);
      }
      clips.set(watcher, actions);

      play(watcher, DEFAULT_WATCHER_ACTION);
    }),
  );

  const focus = (watcher: WatcherId): WatcherFocus | null => {
    const pivot = pivots.get(watcher);
    const face = faces.get(watcher);
    if (!pivot || !face) return null;

    // Aim at the live face — clips move it off the bind-pose pivot.
    face.updateWorldMatrix(true, false);
    const centre = new Box3().setFromObject(face).getCenter(new Vector3());
    const anchor = centre.clone();
    anchor.y -= WATCHER_FOCUS_AIM_DOWN;

    // Stand in front of the screen on the horizontal plane. The pivot also pitches
    // down at the dog — keeping that tilt on the eye drops the camera under the face.
    const ahead = new Vector3(0, 0, 1).applyQuaternion(
      pivot.getWorldQuaternion(new Quaternion()),
    );
    ahead.y = 0;
    if (ahead.lengthSq() < 1e-8) ahead.set(0, 0, 1);
    ahead.normalize().multiplyScalar(WATCHER_FOCUS_DISTANCE);

    const eye = centre.clone().add(ahead);

    return { anchor, eye };
  };

  return {
    focus,
    root: (watcher) => pivots.get(watcher) ?? null,
    tick: (deltaSec, isAnimated) => {
      if (!rig.visible) return;
      for (const face of animatedFaces.values())
        face.tick(deltaSec, isAnimated);
      if (isAnimated) {
        for (const mixer of mixers.values()) mixer.update(deltaSec);
      }
    },
    play,
    setLifted: (watcher) => {
      for (const id of WATCHER_IDS) {
        const pivot = pivots.get(id);
        if (!pivot) continue;
        const spot = WATCHER_PLACEMENT[id];
        const lift = watcher === id ? WATCHER_FOCUS_LIFT : 0;
        pivot.position.set(spot.x, spot.y + lift, spot.z);
      }
    },
    setVisible: (isVisible) => {
      rig.visible = isVisible;
    },
    dispose: () => {
      for (const mixer of mixers.values()) mixer.stopAllAction();
      for (const look of looks.values()) {
        for (const texture of look.values()) texture.dispose();
      }
      looks.clear();
      animatedFaces.clear();
      mount.remove(rig);
      for (const root of roots) disposeTree(root);
    },
  };
};

export type { WatcherFocus, Watchers };
export { attachWatchers };
