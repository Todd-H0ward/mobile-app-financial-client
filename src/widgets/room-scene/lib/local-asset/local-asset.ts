import { Asset } from 'expo-asset';
import { SRGBColorSpace, Texture } from 'three';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LocalFile {
  /** `file://` path for expo-gl / fetch. */
  uri: string;
  width: number;
  height: number;
}

interface TextureOptions {
  /** `false` for glTF UVs; `true` for watcher face PNGs. */
  isFlipped: boolean;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isFileUri = (uri: string | null | undefined): uri is string =>
  typeof uri === 'string' && uri.startsWith('file://');

/**
 * Resolve a bundled module to a real `file://` on disk.
 * Android release often returns a drawable name as `localUri` — re-download into cache.
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
 * GLB bytes for `GLTFLoader.parseAsync`. Prefer Metro `http(s)` `uri` in Expo Go — cached
 * `file://` there 404s on Android `fetch`.
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

/** Texture with `localUri` + size — expo-gl needs both or uploads draw nothing. */
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
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

export type { LocalFile, TextureOptions };
export { loadGlTexture, localFileOf, readAssetBytes };
