import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  /** What `Asset.fromModule` hands back, set per test. */
  bundled: null as unknown,
  /** Every uri a fresh asset was asked to download. */
  downloads: [] as string[],
}));

vi.mock('expo-asset', () => {
  class Asset {
    name: string;
    type: string;
    hash: string | null;
    uri: string;
    width?: number;
    height?: number;
    localUri: string | null = null;
    downloaded = false;

    constructor(descriptor: {
      name: string;
      type: string;
      hash?: string | null;
      uri: string;
      width?: number | null;
      height?: number | null;
    }) {
      this.name = descriptor.name;
      this.type = descriptor.type;
      this.hash = descriptor.hash ?? null;
      this.uri = descriptor.uri;
      this.width = descriptor.width ?? undefined;
      this.height = descriptor.height ?? undefined;
    }

    static fromModule = () => mocks.bundled;

    async downloadAsync() {
      mocks.downloads.push(this.uri);
      this.localUri = `file:///cache/${this.name}.${this.type}`;
      this.downloaded = true;
      return this;
    }
  }
  return { Asset };
});

import { localFileOf, readAssetBytes } from './local-asset';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

beforeEach(() => {
  mocks.downloads = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('localFileOf', () => {
  it('copies an Android release image out of the APK instead of trusting its drawable name', async () => {
    // What expo-asset does for a bundled PNG in a release APK.
    mocks.bundled = {
      name: 'body',
      type: 'png',
      hash: 'abc',
      uri: 'assets_robotdog_skins_factory_body',
      localUri: 'assets_robotdog_skins_factory_body',
      downloaded: true,
      width: 1024,
      height: 512,
      downloadAsync: vi.fn(),
    };

    const file = await localFileOf(1);

    expect(file).toEqual({
      uri: 'file:///cache/body.png',
      width: 1024,
      height: 512,
    });
    expect(mocks.downloads).toEqual(['assets_robotdog_skins_factory_body']);
  });

  it('leaves a file that is already on disk alone', async () => {
    const downloadAsync = vi.fn();
    mocks.bundled = {
      name: 'face',
      type: 'png',
      uri: 'file:///bundle/face.png',
      localUri: 'file:///bundle/face.png',
      downloaded: true,
      width: 8,
      height: 8,
      downloadAsync,
    };

    expect((await localFileOf(2)).uri).toBe('file:///bundle/face.png');
    expect(downloadAsync).not.toHaveBeenCalled();
  });

  it('refuses to hand GL something that is not a file', async () => {
    mocks.bundled = {
      name: 'model',
      type: 'glb',
      uri: 'assets_model',
      localUri: null,
      downloaded: false,
      downloadAsync: async () => undefined,
    };

    await expect(localFileOf(3)).rejects.toThrow(/did not land on disk/);
  });
});

describe('readAssetBytes', () => {
  it('reads a Metro/dev model from the http source uri, not the cached file://', async () => {
    const bytes = new ArrayBuffer(4);
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => bytes,
    });
    vi.stubGlobal('fetch', fetch);
    mocks.bundled = {
      name: 'robot-dog',
      type: 'glb',
      uri: 'http://127.0.0.1:8081/assets/robot-dog.glb',
      localUri: 'file:///cache/ExperienceData/ExponentAsset-abc.glb',
      downloaded: true,
      downloadAsync: vi.fn(),
    };

    expect(await readAssetBytes(4)).toBe(bytes);
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8081/assets/robot-dog.glb',
    );
  });

  it('reads a release model from its local copy, not from the resource name', async () => {
    const bytes = new ArrayBuffer(4);
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => bytes,
    });
    vi.stubGlobal('fetch', fetch);
    const bundled = {
      name: 'robot-dog',
      type: 'glb',
      uri: 'assets_robotdog_robotdog',
      localUri: null as string | null,
      downloaded: false,
      downloadAsync: async () => {
        bundled.localUri = 'file:///cache/robot-dog.glb';
        return bundled;
      },
    };
    mocks.bundled = bundled;

    expect(await readAssetBytes(5)).toBe(bytes);
    expect(fetch).toHaveBeenCalledWith('file:///cache/robot-dog.glb');
  });
});
