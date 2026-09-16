import { describe, expect, it } from 'vitest';

import { EMOTION_KEYS, EMOTIONS } from '../emotions';

import {
  ANIMATION_KEYS,
  ANIMATIONS,
  type AnimationKey,
  BREATH_DEPTH,
  getAnimation,
  REST,
} from './animations';

// ═══════════════════════════════════════════
// 1. Every face has an animation to play
// ═══════════════════════════════════════════

describe('the catalogue covers the faces', () => {
  it('gives every emotion an animation that exists', () => {
    for (const key of EMOTION_KEYS) {
      const { animation } = EMOTIONS[key];

      // A missing entry is not a wrong drawing, it is `getAnimation`
      // returning undefined and the renderer crashing on the next frame.
      expect(ANIMATION_KEYS).toContain(animation as AnimationKey);
      expect(getAnimation(animation as AnimationKey)).toBeDefined();
    }
  });

  it('leaves nothing in the catalogue unreachable by accident', () => {
    const used = new Set(EMOTION_KEYS.map((key) => EMOTIONS[key].animation));

    // Not a failure by itself — an animation may be played directly through
    // the `animation` prop — so this only pins what is currently spare.
    expect(ANIMATION_KEYS.filter((key) => !used.has(key))).toEqual([]);
  });
});

// ═══════════════════════════════════════════
// 2. A track the player can actually run
// ═══════════════════════════════════════════

describe('tracks', () => {
  it('never ships an empty keyframe list', () => {
    for (const key of ANIMATION_KEYS) {
      for (const track of getAnimation(key).tracks) {
        expect(track.keyframes.length).toBeGreaterThan(0);
      }
    }
  });

  it('gives every step a duration above zero', () => {
    for (const key of ANIMATION_KEYS) {
      for (const track of getAnimation(key).tracks) {
        for (const [, duration] of track.keyframes) {
          expect(duration).toBeGreaterThan(0);
        }
      }
    }
  });

  it('drives one channel of one layer at most once', () => {
    for (const key of ANIMATION_KEYS) {
      const seen = getAnimation(key).tracks.map(
        (track) => `${track.layer}.${track.channel}`,
      );

      // Two tracks on one channel would fight, and the last one written wins.
      expect(new Set(seen).size).toBe(seen.length);
    }
  });

  it('keeps the idle free of tracks — breathing rides over the pose', () => {
    expect(getAnimation('breathe').tracks).toEqual([]);
  });
});

// ═══════════════════════════════════════════
// 3. Breathing
// ═══════════════════════════════════════════

describe('breath', () => {
  it('stays shallow wherever an animation tunes it', () => {
    for (const key of ANIMATION_KEYS) {
      const { breathDepth } = getAnimation(key);
      if (breathDepth === undefined) continue;

      expect(breathDepth).toBeGreaterThanOrEqual(0);
      expect(breathDepth).toBeLessThan(0.2);
    }
  });

  it('breathes deeper asleep than awake', () => {
    expect(getAnimation('sleep').breathDepth ?? BREATH_DEPTH).toBeGreaterThan(
      BREATH_DEPTH,
    );
  });

  it('holds the chest of a pet that is already puffed out', () => {
    expect(getAnimation('puff').breathDepth).toBe(0);
  });

  it('closes the eyes of a sleeping pet instead of blinking them', () => {
    expect(getAnimation('sleep').blink).toBe(false);
  });
});

// ═══════════════════════════════════════════
// 4. Rest
// ═══════════════════════════════════════════

describe('REST', () => {
  it('rests scales at one and offsets at zero', () => {
    expect(REST).toEqual({
      translateX: 0,
      translateY: 0,
      rotate: 0,
      scale: 1,
      scaleY: 1,
    });
  });

  it('names every channel a track may drive', () => {
    for (const key of ANIMATION_KEYS) {
      for (const track of getAnimation(key).tracks) {
        expect(REST[track.channel]).toBeDefined();
      }
    }
  });
});

// ═══════════════════════════════════════════
// 5. The shape of the whole catalogue
// ═══════════════════════════════════════════

describe('ANIMATIONS', () => {
  it('keys every entry by its own id', () => {
    for (const key of ANIMATION_KEYS) {
      expect(ANIMATIONS[key].id).toBe(key);
    }
  });

  it('gives every entry a title, for the UI kit and the debug rows', () => {
    for (const key of ANIMATION_KEYS) {
      expect(getAnimation(key).title.length).toBeGreaterThan(0);
    }
  });
});
