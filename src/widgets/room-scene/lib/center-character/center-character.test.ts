import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  download: vi.fn<(id: number) => Promise<void>>(),
  parse: vi.fn(),
}));
vi.mock('expo-asset', () => ({
  Asset: {
    fromModule: (id: number) => ({
      localUri: `file://${id}`,
      width: 16,
      height: 16,
      downloadAsync: () => mocks.download(id),
    }),
  },
}));
vi.mock('react-native', () => ({
  Image: { resolveAssetSource: () => ({ uri: 'file://robot' }) },
}));
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    parseAsync = mocks.parse;
  },
}));
vi.mock('../robot-dog-assets', () => ({
  ROBOT_DOG_MODEL: 1,
  ROBOT_DOG_MATERIAL_SLOTS: { Body: 'body' },
  ROBOT_DOG_TEXTURES: {
    factory: { body: 1, dark: 2, mid: 3 },
    arctic: { body: 4, dark: 5, mid: 6 },
    carbon: { body: 7, dark: 8, mid: 9 },
  },
}));

import { attachCenterCharacter } from './center-character';

const deferred = () => {
  let resolve = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

let material: MeshStandardMaterial;
let geometry: BoxGeometry;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.download.mockResolvedValue(undefined);
  material = new MeshStandardMaterial();
  material.name = 'Body';
  geometry = new BoxGeometry();
  const scene = new Group();
  scene.add(new Mesh(geometry, material), new Mesh(geometry, material));
  mocks.parse.mockResolvedValue({ scene, animations: [] });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(0),
    }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('robot resource lifetime', () => {
  it('keeps the latest selected coat when an older download finishes last', async () => {
    const dog = await attachCenterCharacter(new Group(), 'factory', 'idle');
    const slow = deferred();
    mocks.download.mockImplementation((id) =>
      id >= 4 && id <= 6 ? slow.promise : Promise.resolve(),
    );
    const older = dog.setSkin('arctic');
    await dog.setSkin('carbon');
    slow.resolve();
    await older;
    expect(material.map?.image).toMatchObject({ localUri: 'file://7' });
    dog.dispose();
  });

  it('does not reattach a coat after disposal, and disposes each shared resource once', async () => {
    const dog = await attachCenterCharacter(new Group(), 'factory', 'idle');
    const releaseGeometry = vi.spyOn(geometry, 'dispose');
    const releaseMaterial = vi.spyOn(material, 'dispose');
    const releaseTexture = vi.spyOn(Texture.prototype, 'dispose');
    const slow = deferred();
    mocks.download.mockReturnValue(slow.promise);
    const loading = dog.setSkin('arctic');
    dog.dispose();
    dog.dispose();
    slow.resolve();
    await loading;
    expect(releaseGeometry).toHaveBeenCalledTimes(1);
    expect(releaseMaterial).toHaveBeenCalledTimes(1);
    expect(releaseTexture).toHaveBeenCalledTimes(6);
    expect(material.map?.image).toMatchObject({ localUri: 'file://1' });
  });

  it('releases partially loaded textures and leaves the current coat intact on failure', async () => {
    const dog = await attachCenterCharacter(new Group(), 'factory', 'idle');
    const released = vi.spyOn(Texture.prototype, 'dispose');
    mocks.download.mockImplementation((id) =>
      id === 5 ? Promise.reject(new Error('missing asset')) : Promise.resolve(),
    );
    await expect(dog.setSkin('arctic')).rejects.toThrow('missing asset');
    expect(released).toHaveBeenCalledTimes(2);
    expect(material.map?.image).toMatchObject({ localUri: 'file://1' });
    dog.dispose();
  });

  it('releases textures when model parsing fails', async () => {
    const released = vi.spyOn(Texture.prototype, 'dispose');
    mocks.parse.mockRejectedValue(new Error('bad model'));
    await expect(
      attachCenterCharacter(new Group(), 'factory', 'idle'),
    ).rejects.toThrow('bad model');
    expect(released).toHaveBeenCalledTimes(3);
  });
});
