import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => {
  const disk = new Map<string, string>();
  return {
    disk,
    getItemSync: vi.fn((key: string) => disk.get(key) ?? null),
    setItemSync: vi.fn((key: string, value: string) => {
      disk.set(key, value);
    }),
    removeItemSync: vi.fn((key: string) => disk.delete(key)),
  };
});

vi.mock('expo-sqlite/kv-store', () => ({ default: native }));

import { createPersistStorage } from './persist-storage';

const storage = createPersistStorage<{ balance: number }>();
const snapshot = (balance: number) => ({ state: { balance }, version: 1 });

describe('persist storage durability', () => {
  beforeEach(() => {
    native.disk.clear();
    vi.clearAllMocks();
  });

  it('commits before returning, without a timer or a lifecycle flush', () => {
    storage?.setItem('profile', snapshot(50));
    expect(JSON.parse(native.disk.get('profile') ?? 'null')).toEqual(
      snapshot(50),
    );
    expect(storage?.getItem('profile')).toEqual(snapshot(50));
  });

  it('keeps the newest of consecutive operations on disk', () => {
    storage?.setItem('profile', snapshot(50));
    storage?.setItem('profile', snapshot(30));
    expect(storage?.getItem('profile')).toEqual(snapshot(30));
  });

  it('cannot resurrect a deleted profile from a pending write', async () => {
    storage?.setItem('profile', snapshot(50));
    storage?.removeItem('profile');
    await Promise.resolve();
    expect(native.disk.has('profile')).toBe(false);
    expect(storage?.getItem('profile')).toBeNull();
  });

  it('does not report a failed write as successful', () => {
    native.setItemSync.mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    expect(() => storage?.setItem('profile', snapshot(50))).toThrow(
      'disk full',
    );
    expect(native.disk.has('profile')).toBe(false);
  });

  it('does not report a failed delete as successful', () => {
    storage?.setItem('profile', snapshot(50));
    native.removeItemSync.mockImplementationOnce(() => {
      throw new Error('disk unavailable');
    });
    expect(() => storage?.removeItem('profile')).toThrow('disk unavailable');
    expect(storage?.getItem('profile')).toEqual(snapshot(50));
  });
});
