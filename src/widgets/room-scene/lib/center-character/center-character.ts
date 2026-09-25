import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import {
  type AnimationAction,
  type AnimationClip,
  AnimationMixer,
  Box3,
  type Group,
  LoopOnce,
  LoopRepeat,
  type Mesh,
  MeshStandardMaterial,
  type Object3D,
  SRGBColorSpace,
  Texture,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import {
  ROBOT_DOG_CLIPS,
  ROBOT_DOG_FADE_SEC,
  type RobotDogAction,
  type RobotDogSkin,
} from '@/entities/robot-dog';

import {
  ROBOT_DOG_MATERIAL_SLOTS,
  ROBOT_DOG_MODEL,
  ROBOT_DOG_TEXTURES,
  type RobotDogTextureSlot,
} from '../robot-dog-assets';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CenterCharacter {
  /** What a tap ray is tested against. */
  root: Object3D;
  /** Advances the clip — call once per frame with the frame delta. */
  tick: (deltaSec: number) => void;
  /**
   * Changes the coat without touching the model.
   *
   * Every skin is the same mesh and the same clips, so a swap is three new
   * textures — not three and a half megabytes of GLB parsed again.
   */
  setSkin: (skin: RobotDogSkin) => Promise<void>;
  /** Crossfades into another clip. Same clip twice is a no-op. */
  play: (action: RobotDogAction) => void;
  /**
   * Plays a clip through once and settles back into `fallback`.
   *
   * This is what a tap gets: the dog answers, then goes back to whatever its
   * state says it should be doing.
   */
  playOnce: (action: RobotDogAction, fallback: RobotDogAction) => void;
  dispose: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Target height in arena units, so the dog reads next to the discs. */
const CHARACTER_HEIGHT = 95;

/**
 * The scene has a key, a fill and ambient — no environment map.
 *
 * A metalness of 1 with nothing to reflect renders as black, which is how a
 * chrome robot turns into a silhouette. Clamping it keeps the metal reading
 * as metal under the three lights we do have.
 */
const MAX_METALNESS = 0.3;

/** Below this a clamped-metal surface goes mirror-flat and loses its edges. */
const MIN_ROUGHNESS = 0.35;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const fitOnPlatform = (root: Object3D) => {
  const box = new Box3().setFromObject(root);
  const size = new Vector3();
  box.getSize(size);
  if (size.y <= 0) return;

  root.scale.setScalar(CHARACTER_HEIGHT / size.y);

  box.setFromObject(root);
  const center = new Vector3();
  box.getCenter(center);
  // Sit on the platform (y = 0 in the arena root) and on the axis.
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;
};

/**
 * A texture expo-gl can actually upload.
 *
 * The native side reads pixels off a `file://` path — it never sees a decoded
 * bitmap — so the asset has to be on disk first. `downloadAsync` is what puts
 * it there: in development the file arrives from Metro, in a release build it
 * is unpacked out of the bundle.
 */
const loadTexture = async (module: number): Promise<Texture> => {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();

  const localUri = asset.localUri ?? asset.uri;
  const texture = new Texture();
  // three reads width and height off the image; the native loader fills in
  // the pixels. Both have to be there or the upload silently draws nothing.
  texture.image = {
    localUri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
  };
  // glTF lays its UVs out top-down, and albedo is colour, not data.
  texture.flipY = false;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
};

const loadSkinTextures = async (
  skin: RobotDogSkin,
): Promise<Map<RobotDogTextureSlot, Texture>> => {
  const slots: RobotDogTextureSlot[] = ['body', 'dark', 'mid'];
  const results = await Promise.allSettled(
    slots.map(async (slot) => {
      const texture = await loadTexture(ROBOT_DOG_TEXTURES[skin][slot]);
      return [slot, texture] as const;
    }),
  );

  const textures = new Map<RobotDogTextureSlot, Texture>();
  for (const result of results) {
    if (result.status === 'fulfilled') textures.set(...result.value);
  }
  const failure = results.find((result) => result.status === 'rejected');
  if (failure?.status === 'rejected') {
    for (const texture of textures.values()) texture.dispose();
    throw failure.reason;
  }
  return textures;
};

/**
 * Dresses the model in a coat and brings its PBR down to what we can light.
 *
 * The albedo is the coat — without it all seven skins are the same white dog.
 * Normal, roughness and metalness maps go: they cost two to four times the
 * texture memory for a model this size, and the 3D brief puts them outside
 * the first-stage budget (docs/design-brief-3d.md).
 */
const tameMaterials = (root: Object3D): MeshStandardMaterial[] => {
  const painted = new Set<MeshStandardMaterial>();

  root.traverse((object) => {
    const material = (object as Mesh).material;
    if (!material) return;

    for (const entry of Array.isArray(material) ? material : [material]) {
      if (!(entry instanceof MeshStandardMaterial)) continue;

      entry.metalness = Math.min(entry.metalness, MAX_METALNESS);
      entry.roughness = Math.max(entry.roughness, MIN_ROUGHNESS);
      entry.needsUpdate = true;

      // A material with no coat of its own keeps the flat colour the artist
      // gave it — `Glow` and `Accent` were never painted.
      if (ROBOT_DOG_MATERIAL_SLOTS[entry.name]) painted.add(entry);
    }
  });

  return [...painted];
};

/** Hangs a freshly loaded coat on the materials that wear one. */
const dressMaterials = (
  painted: MeshStandardMaterial[],
  textures: Map<RobotDogTextureSlot, Texture>,
) => {
  for (const material of painted) {
    const coat = textures.get(ROBOT_DOG_MATERIAL_SLOTS[material.name]);
    if (!coat) continue;

    material.map = coat;
    material.needsUpdate = true;
  }
};

const disposeTree = (root: Object3D) => {
  const geometries = new Set<Mesh['geometry']>();
  const materials = new Set<MeshStandardMaterial>();
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (!mesh.material) return;
    for (const entry of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      materials.add(entry as MeshStandardMaterial);
    }
  });
  // Coat textures have one owner below; shared meshes must not dispose them twice.
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
};

const loadGlbBuffer = async (): Promise<ArrayBuffer> => {
  const resolved = Image.resolveAssetSource(ROBOT_DOG_MODEL);
  if (!resolved?.uri) {
    throw new Error('robot dog model has no uri');
  }

  const response = await fetch(resolved.uri);
  if (!response.ok) {
    throw new Error(`Failed to load the robot dog (${response.status})`);
  }
  return response.arrayBuffer();
};

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/**
 * The robot dog at the arena centre.
 *
 * Loads async so the GL context can paint the arena first — the model is five
 * megabytes and parsing it on the first frame would cost the cold start.
 */
export const attachCenterCharacter = async (
  mount: Group,
  skin: RobotDogSkin,
  action: RobotDogAction,
): Promise<CenterCharacter> => {
  const results = await Promise.allSettled([
    loadGlbBuffer().then((buffer) => new GLTFLoader().parseAsync(buffer, '')),
    loadSkinTextures(skin),
  ]);
  const [modelResult, textureResult] = results;
  if (
    modelResult.status === 'rejected' ||
    textureResult.status === 'rejected'
  ) {
    if (modelResult.status === 'fulfilled')
      disposeTree(modelResult.value.scene);
    if (textureResult.status === 'fulfilled') {
      for (const texture of textureResult.value.values()) texture.dispose();
    }
    throw modelResult.status === 'rejected'
      ? modelResult.reason
      : textureResult.status === 'rejected'
        ? textureResult.reason
        : new Error('Robot loading failed');
  }
  const gltf = modelResult.value;
  const textures = textureResult.value;
  let isDisposed = false;
  let skinRequest = 0;

  const root = gltf.scene;
  fitOnPlatform(root);
  const painted = tameMaterials(root);
  let coat = textures;
  dressMaterials(painted, coat);
  mount.add(root);

  const mixer = new AnimationMixer(root);
  const clips = new Map<RobotDogAction, AnimationClip>();
  for (const [key, name] of Object.entries(ROBOT_DOG_CLIPS)) {
    const clip = gltf.animations.find((entry) => entry.name === name);
    if (clip) clips.set(key as RobotDogAction, clip);
  }

  let current: AnimationAction | null = null;
  /** Set while a one-shot is playing, so `tick` knows where to return. */
  let settleInto: RobotDogAction | null = null;

  const start = (next: RobotDogAction, isOnce: boolean) => {
    if (isDisposed) return;
    const clip = clips.get(next);
    if (!clip) return;

    const action = mixer.clipAction(clip);
    if (action === current && !isOnce) return;

    action.reset();
    action.setLoop(isOnce ? LoopOnce : LoopRepeat, Number.POSITIVE_INFINITY);
    action.clampWhenFinished = isOnce;
    action.fadeIn(ROBOT_DOG_FADE_SEC).play();
    if (current && current !== action) current.fadeOut(ROBOT_DOG_FADE_SEC);
    current = action;
  };

  const play = (next: RobotDogAction) => {
    settleInto = null;
    start(next, false);
  };

  const playOnce = (next: RobotDogAction, fallback: RobotDogAction) => {
    if (!clips.has(next)) {
      play(fallback);
      return;
    }
    settleInto = fallback;
    start(next, true);
  };

  mixer.addEventListener('finished', () => {
    if (settleInto === null) return;
    const fallback = settleInto;
    settleInto = null;
    start(fallback, false);
  });

  play(action);

  return {
    root,
    tick: (deltaSec) => {
      if (!isDisposed) mixer.update(deltaSec);
    },
    setSkin: async (next) => {
      if (isDisposed) return;
      const request = ++skinRequest;
      const loaded = await loadSkinTextures(next);
      if (isDisposed || request !== skinRequest) {
        for (const texture of loaded.values()) texture.dispose();
        return;
      }
      const previous = coat;
      coat = loaded;
      dressMaterials(painted, loaded);
      // Only now: the old textures were still bound while the new ones loaded.
      for (const texture of previous.values()) texture.dispose();
    },
    play,
    playOnce,
    dispose: () => {
      if (isDisposed) return;
      isDisposed = true;
      skinRequest += 1;
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      mount.remove(root);
      disposeTree(root);
      for (const texture of coat.values()) texture.dispose();
    },
  };
};

export type { CenterCharacter };
