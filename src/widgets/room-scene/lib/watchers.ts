import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import {
  type AnimationAction,
  AnimationMixer,
  Box3,
  Group,
  type Mesh,
  MeshStandardMaterial,
  type Object3D,
  Quaternion,
  SRGBColorSpace,
  Texture,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { TOP_AZIMUTH } from '@/entities/scene';
import {
  DEFAULT_WATCHER_ACTION,
  WATCHER_ACTIONS,
  WATCHER_CLIPS,
  WATCHER_FADE_SEC,
  WATCHER_FOCUS_DISTANCE,
  WATCHER_HIDDEN_MATERIALS,
  WATCHER_IDS,
  WATCHER_PLACEMENT,
  WATCHER_UNITS_PER_METRE,
  WATCHER_YAW,
  type WatcherAction,
  type WatcherId,
} from '@/entities/watcher';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Watchers {
  /** Advances both clips — call once per frame with the frame delta. */
  tick: (deltaSec: number) => void;
  /** Crossfades one screen into another state. */
  play: (watcher: WatcherId, action: WatcherAction) => void;
  /** What a tap ray is tested against — `null` until the model has loaded. */
  root: (watcher: WatcherId) => Object3D | null;
  /**
   * Where the camera stands to talk to one, and what it looks at.
   *
   * Read off the model rather than computed from the placement: the screen
   * is wherever its pivot ended up, and the eye is straight out in front of
   * it, so a change of yaw moves the shot with the face instead of leaving
   * the camera staring at the back of a television.
   */
  focus: (watcher: WatcherId) => WatcherFocus | null;
  dispose: () => void;
}

interface WatcherFocus {
  /** World point the camera aims at: the middle of the screen. */
  anchor: Vector3;
  /** World point the camera flies to, `WATCHER_FOCUS_DISTANCE` in front. */
  eye: Vector3;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Model files, resolved by Metro at build time.
 *
 * Relative `require` on purpose: the `@/*` alias points at `src/`, so it never
 * reaches `assets/`, and `.glb` only resolves because `metro.config.js` lists
 * it under `assetExts`.
 */
const WATCHER_MODELS: Record<WatcherId, number> = {
  overseer: require('../../../../assets/scene/watchers/overseer.glb') as number,
  keeper: require('../../../../assets/scene/watchers/keeper.glb') as number,
};

/**
 * The face on the screen, one per state.
 *
 * The artist ships a frame per clip and says to swap it into the `Screen`
 * material when the animation changes (`*.README.txt` beside the models) —
 * without that the strict one rages with a resting face on.
 */
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

/** The material the artist put the face on, in both models. */
const SCREEN_MATERIAL = 'Screen';

/**
 * The scene has a key, a fill and ambient — no environment map.
 *
 * Metalness of 1 with nothing to reflect renders as black, which is how a
 * chrome case turns into a silhouette.
 */
const MAX_METALNESS = 0.3;

/** How brightly a screen glows on its own, with no lamp pointed at it. */
const SCREEN_GLOW = 1.1;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * A texture expo-gl can actually upload.
 *
 * The native side reads pixels off a `file://` path — it never sees a decoded
 * bitmap — so the asset has to be on disk first (see docs/scene.md).
 */
const loadTexture = async (module: number): Promise<Texture> => {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();

  const texture = new Texture();
  texture.image = {
    localUri: asset.localUri ?? asset.uri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
  };
  // Faces are the one texture where a flip is not a subtlety: upside down,
  // the keeper's smile arches over its eyes as a frown. expo-gl hands the
  // pixels to GL the way stb read them — top row first — so the screen has to
  // be turned back over, unlike the dog's coats where nobody could tell.
  texture.flipY = true;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
};

const loadGlbBuffer = async (watcher: WatcherId): Promise<ArrayBuffer> => {
  const resolved = Image.resolveAssetSource(WATCHER_MODELS[watcher]);
  if (!resolved?.uri) throw new Error(`watcher "${watcher}" has no uri`);

  const response = await fetch(resolved.uri);
  if (!response.ok) {
    throw new Error(`Failed to load watcher "${watcher}" (${response.status})`);
  }
  return response.arrayBuffer();
};

/**
 * Brings the artist's PBR down to what this scene can light, and lights the
 * face from inside.
 *
 * The screen is the whole point of these two: it is the only part that says
 * which of them is being kind to you.
 */
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

/**
 * The two screens that watch the arena.
 *
 * They hang in the world, over the far side of the arena — the strict one on
 * the right, the kind one on the left — and they stay there. An earlier
 * version turned the pair to follow the camera, which kept them in frame but
 * read as a sticker on the lens: they never moved, so they never looked like
 * objects. Fixed, they slide past as the child walks to another room, and the
 * rig is aligned to the overhead view once so the pose is composed for the
 * shot the child opens on.
 */
const attachWatchers = async (mount: Group): Promise<Watchers> => {
  const rig = new Group();
  rig.rotation.y = (TOP_AZIMUTH * Math.PI) / 180;
  mount.add(rig);

  const loader = new GLTFLoader();
  const mixers = new Map<WatcherId, AnimationMixer>();
  const clips = new Map<WatcherId, Map<WatcherAction, AnimationAction>>();
  const current = new Map<WatcherId, AnimationAction>();
  const roots: Object3D[] = [];
  /** One per watcher, sitting exactly on its screen — the focus point. */
  const pivots = new Map<WatcherId, Group>();
  /** The display itself, which the clips move: what the camera really aims at. */
  const faces = new Map<WatcherId, Object3D>();
  /** The `Screen` material of each, so a state change can repaint the face. */
  const screens = new Map<WatcherId, MeshStandardMaterial>();
  /** Every face already on the GPU, by watcher and state. */
  const looks = new Map<WatcherId, Map<WatcherAction, Texture>>();

  const play = (watcher: WatcherId, action: WatcherAction) => {
    // The face changes even when the clip does not: a state the model has no
    // animation for still has something to say on the screen.
    const look = looks.get(watcher)?.get(action);
    const screen = screens.get(watcher);
    if (look && screen && screen.map !== look) {
      screen.map = look;
      screen.emissiveMap = look;
      screen.needsUpdate = true;
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
        loadGlbBuffer(watcher),
        Promise.all(
          WATCHER_ACTIONS.map(async (action) =>
            loadTexture(WATCHER_SCREENS[watcher][action]),
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
      if (screenMaterial) screens.set(watcher, screenMaterial);
      root.scale.setScalar(WATCHER_UNITS_PER_METRE);

      // Hang each one by its screen: the bracket's own origin is wherever
      // the artist left it, and what has to land in the corner of the frame
      // is the face, not the hardware behind it.
      const screen =
        root.getObjectByName('Screen') ?? root.getObjectByName('Head') ?? root;
      const box = new Box3().setFromObject(screen);
      const centre = new Vector3();
      box.getCenter(centre);

      // Hang the pivot where the face has to be and push the model back by
      // the same offset, so the yaw below turns the machine about its own
      // screen rather than swinging it across the frame.
      const spot = WATCHER_PLACEMENT[watcher];
      const pivot = new Group();
      pivot.position.set(spot.x, spot.y, spot.z);
      pivot.rotation.y = (WATCHER_YAW[watcher] * Math.PI) / 180;
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
        if (clip) actions.set(action as WatcherAction, mixer.clipAction(clip));
      }
      clips.set(watcher, actions);

      play(watcher, DEFAULT_WATCHER_ACTION);
    }),
  );

  const focus = (watcher: WatcherId): WatcherFocus | null => {
    const pivot = pivots.get(watcher);
    const face = faces.get(watcher);
    if (!pivot || !face) return null;

    // The display, where it is this frame. The pivot is where it was in the
    // bind pose, and both machines drift a long way off that — the overseer
    // hovers, the keeper swings on its bracket — so aiming at the pivot
    // leaves the camera staring at the cable below an empty sky.
    face.updateWorldMatrix(true, false);
    const anchor = new Box3().setFromObject(face).getCenter(new Vector3());

    // +Z is the way a screen faces in its own space, so this is the seat
    // directly in front of it however the rig and the yaw have turned it.
    // Taken off the pivot rather than the face: the clips rock the machine,
    // and a camera that copied that would rock with it.
    const ahead = new Vector3(0, 0, 1)
      .applyQuaternion(pivot.getWorldQuaternion(new Quaternion()))
      .multiplyScalar(WATCHER_FOCUS_DISTANCE);

    return { anchor, eye: anchor.clone().add(ahead) };
  };

  return {
    focus,
    root: (watcher) => pivots.get(watcher) ?? null,
    tick: (deltaSec) => {
      for (const mixer of mixers.values()) mixer.update(deltaSec);
    },
    play,
    dispose: () => {
      for (const mixer of mixers.values()) mixer.stopAllAction();
      for (const look of looks.values()) {
        for (const texture of look.values()) texture.dispose();
      }
      looks.clear();
      mount.remove(rig);
      for (const root of roots) disposeTree(root);
    },
  };
};

export type { WatcherFocus, Watchers };
export { attachWatchers };
