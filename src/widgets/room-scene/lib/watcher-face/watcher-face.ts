import {
  type MeshStandardMaterial,
  ShaderChunk,
  Vector2,
  Vector4,
} from 'three';

import type { WatcherAction, WatcherId } from '@/entities/watcher';

import { WATCHER_FACE_SHADER } from './shader';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WatcherFace {
  setAction: (action: WatcherAction) => void;
  tick: (deltaSec: number, isAnimated: boolean) => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const BLINK_DURATION = 0.24;
const MIN_EYE_OPEN = 0.045;
const MAX_DELTA = 0.1;
const KEEPER_BLINKS = [2.1, 6.8, 7.15];
const OVERSEER_BLINKS = [3.4, 8.9];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** Separate, uneven blink schedules keep the two machines from moving in unison. */
const eyeOpenAt = (time: number, isKeeper: boolean) => {
  const cycle = isKeeper ? 10.7 : 13.1;
  const phase = time % cycle;
  const moments = isKeeper ? KEEPER_BLINKS : OVERSEER_BLINKS;
  for (const moment of moments) {
    const age = phase - moment;
    if (age < 0 || age > BLINK_DURATION) continue;
    const closed =
      age < 0.09 ? smooth(age / 0.09) : 1 - smooth((age - 0.09) / 0.15);
    return 1 - closed * (1 - MIN_EYE_OPEN);
  }
  return 1;
};

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/** Reuses the screen material, texture slots and draw call; only uniforms change. */
export const animateWatcherFace = (
  material: MeshStandardMaterial,
  watcher: WatcherId,
): WatcherFace => {
  const isKeeper = watcher === 'keeper';
  const eyes = new Vector4(0, 0, 1, 1);
  const mouth = new Vector2(1, 1);
  let action: WatcherAction = 'idle';
  let time = 0;
  let actionTime = 0;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWatcherEyes = { value: eyes };
    shader.uniforms.uWatcherMouth = { value: mouth };
    shader.uniforms.uWatcherKind = { value: isKeeper ? 1 : 0 };
    shader.fragmentShader = WATCHER_FACE_SHADER + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <map_fragment>',
        `vec2 watcherUv = watcherFaceUv(vMapUv);\n${ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )', 'textureGrad( map, watcherUv, dFdx(vMapUv), dFdy(vMapUv) )')}`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        ShaderChunk.emissivemap_fragment.replace(
          'texture2D( emissiveMap, vEmissiveMapUv )',
          'textureGrad( emissiveMap, watcherUv, dFdx(vMapUv), dFdy(vMapUv) )',
        ),
      );
  };
  // Both characters share compiled shader code; their art and motion are uniforms.
  material.customProgramCacheKey = () => 'watcher-face-v1';
  material.needsUpdate = true;

  const reset = () => {
    eyes.set(0, 0, 1, 1);
    mouth.set(1, 1);
  };

  return {
    setAction: (next) => {
      if (next === action) return;
      action = next;
      actionTime = 0;
      reset();
    },
    tick: (deltaSec, isAnimated) => {
      if (!isAnimated) {
        reset();
        return;
      }
      const delta = Math.min(MAX_DELTA, Math.max(0, deltaSec));
      time += delta;
      actionTime += delta;
      // The keeper's joy/sleep artwork already has closed eyes and floating hearts.
      const hasOpenEyes =
        !isKeeper || (action !== 'rest' && action !== 'react');
      const gazePhase = time + (isKeeper ? 0 : 4.2);
      const gazeAmount = action === 'rest' ? 0.018 : 0.006;
      eyes.set(
        Math.sin(gazePhase * 0.7) * gazeAmount,
        Math.sin(gazePhase * 0.43) * 0.003,
        eyeOpenAt(time, isKeeper),
        hasOpenEyes ? 1 : 0,
      );

      let height = 1;
      let width = 1;
      if (action === 'talk') {
        // Short groups of syllables separated by pauses; this is stylised speech,
        // not phoneme lip-sync to the short electronic sound effect.
        const phrase = actionTime % 3.4;
        const envelope =
          smooth(phrase / 0.16) * (1 - smooth((phrase - 2.25) / 0.25));
        const syllable =
          (Math.sin(actionTime * 15) + Math.sin(actionTime * 23) + 2) / 4;
        height = 0.16 + envelope * (0.2 + 0.64 * syllable);
        width = 0.94 + envelope * 0.06;
      } else if (action === 'react') {
        height = 0.85 + Math.sin(actionTime * 5) * 0.15;
      } else if (action === 'rest' && isKeeper) {
        height = 0.8 + Math.sin(actionTime * 1.4) * 0.15;
      }
      mouth.set(width, height);
    },
  };
};

export type { WatcherFace };
