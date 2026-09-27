import { Asset } from 'expo-asset';
import { SRGBColorSpace, Texture } from 'three';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LocalFile {
  /** `file://` path the native side can open. */
  uri: string;
  /** Pixel width for an image, `0` for anything else. */
  width: number;
  /** Pixel height for an image, `0` for anything else. */
  height: number;
}

interface TextureOptions {
  /**
   * Whether GL gets the rows bottom-up. glTF UVs want `false`; a picture
   * mapped the ordinary way (the watchers' faces) wants `true`.
   */
  isFlipped: boolean;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isFileUri = (uri: string | null | undefined): uri is string =>
  typeof uri === 'string' && uri.startsWith('file://');

/**
 * A bundled asset as a file on disk, in development and in a release build.
 *
 * Everything the 3D scene loads has to be a real file: expo-gl reads a
 * texture's pixels off a `file://` path, and a GLB is read into memory from
 * one. What a bundled `require` resolves to is not that in a release APK:
 *
 * - a model resolves to a bare Android resource name (`assets_robotdog_…`),
 *   which `fetch` cannot open — the robot and both watchers never loaded;
 * - an image is marked "downloaded" with that same resource name as its
 *   `localUri` (expo-asset keeps it for `<Image>`, which can read drawables),
 *   so `downloadAsync` is skipped and expo-gl is handed a name, not a path.
 *
 * In both cases a fresh `Asset` over the same metadata is not marked
 * downloaded, and its `downloadAsync` copies the resource out of the APK
 * into the cache. In development the file arrives from Metro the same way,
 * and on iOS the bundle already holds a `file://` path.
 */
const localFileOf = async (module: number): Promise<LocalFile> => {
  const bundled = Asset.fromModule(module);
  let asset = bundled;

  if (!isFileUri(bundled.localUri)) {
    if (bundled.downloaded) {
      asset = new Asset({
        name: bundled.name,
        type: bundled.type,
        hash: bundled.hash,
        uri: bundled.uri,
        width: bundled.width,
        height: bundled.height,
      });
    }
    await asset.downloadAsync();
  }

  const uri = asset.localUri ?? asset.uri;
  if (!isFileUri(uri)) {
    throw new Error(`Asset "${bundled.name}" did not land on disk (${uri})`);
  }

  return {
    uri,
    width: bundled.width ?? asset.width ?? 0,
    height: bundled.height ?? asset.height ?? 0,
  };
};

/**
 * A bundled asset's bytes — how a GLB reaches `GLTFLoader.parseAsync`.
 *
 * Prefer the source `uri` when it is an http(s) Metro URL: Expo Go's
 * `downloadAsync` lands a `file://` under ExperienceData that Android's
 * `fetch` answers with 404, so reading the cached path kills the dog and
 * both watchers in development while the release APK (real on-disk copy)
 * keeps working. Release builds still go through `localFileOf` + `fetch`
 * of the copied `file://`, which is what the blob handler can open.
 */
const readAssetBytes = async (module: number): Promise<ArrayBuffer> => {
  const bundled = Asset.fromModule(module);
  const source = bundled.uri;
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok && response.status !== 0) {
      throw new Error(`Failed to read ${source} (${response.status})`);
    }
    return response.arrayBuffer();
  }

  const file = await localFileOf(module);
  const response = await fetch(file.uri);
  if (!response.ok && response.status !== 0) {
    throw new Error(`Failed to read ${file.uri} (${response.status})`);
  }
  return response.arrayBuffer();
};

/**
 * A texture expo-gl can actually upload.
 *
 * three reads width and height off `image`; the native loader fills in the
 * pixels from `localUri`. Both have to be there or the upload silently
 * draws nothing.
 */
const loadGlTexture = async (
  module: number,
  { isFlipped }: TextureOptions,
): Promise<Texture> => {
  const file = await localFileOf(module);

  const texture = new Texture();
  texture.image = {
    localUri: file.uri,
    width: file.width,
    height: file.height,
  };
  texture.flipY = isFlipped;
  // Albedo and faces are colour, not data.
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

export type { LocalFile, TextureOptions };
export { loadGlTexture, localFileOf, readAssetBytes };
