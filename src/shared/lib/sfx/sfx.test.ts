import { afterEach, describe, expect, it, vi } from 'vitest';

import { SOUNDS } from '@/shared/constants/sounds';

import {
  bindSfxAppActive,
  bindSfxSoundGate,
  playSfx,
  registerSfxPlayers,
  stopSfx,
} from './sfx';

const makePlayer = () => ({
  pause: vi.fn(),
  play: vi.fn(),
  seekTo: vi.fn(() => Promise.resolve()),
});

describe('playSfx', () => {
  afterEach(() => {
    bindSfxSoundGate(() => true);
    bindSfxAppActive(() => true);
    registerSfxPlayers({});
    stopSfx();
  });

  it('plays a registered cue', async () => {
    const coin = makePlayer();
    registerSfxPlayers({ [SOUNDS.COIN]: coin });
    playSfx(SOUNDS.COIN);
    await Promise.resolve();
    expect(coin.seekTo).toHaveBeenCalledWith(0);
    expect(coin.play).toHaveBeenCalled();
  });

  it('is silent when sound is gated off', async () => {
    const coin = makePlayer();
    registerSfxPlayers({ [SOUNDS.COIN]: coin });
    bindSfxSoundGate(() => false);
    playSfx(SOUNDS.COIN);
    await Promise.resolve();
    expect(coin.play).not.toHaveBeenCalled();
  });

  it('is silent when the app is inactive', async () => {
    const coin = makePlayer();
    registerSfxPlayers({ [SOUNDS.COIN]: coin });
    bindSfxAppActive(() => false);
    playSfx(SOUNDS.COIN);
    await Promise.resolve();
    expect(coin.play).not.toHaveBeenCalled();
  });

  it('no-ops for an unregistered cue', async () => {
    registerSfxPlayers({});
    expect(() => playSfx(SOUNDS.COIN)).not.toThrow();
  });

  it('debounces the same cue fired twice in a row', async () => {
    const coin = makePlayer();
    registerSfxPlayers({ [SOUNDS.COIN]: coin });
    playSfx(SOUNDS.COIN);
    playSfx(SOUNDS.COIN);
    await Promise.resolve();
    // First call stops then seeks; second is dropped by debounce.
    expect(coin.seekTo).toHaveBeenCalledTimes(1);
  });
});
