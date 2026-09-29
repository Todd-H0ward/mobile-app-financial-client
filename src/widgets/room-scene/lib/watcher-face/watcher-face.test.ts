import {
  MeshStandardMaterial,
  ShaderLib,
  Texture,
  type WebGLRenderer,
} from 'three';
import { describe, expect, it } from 'vitest';

import type { WatcherAction, WatcherId } from '@/entities/watcher';

import { animateWatcherFace } from './watcher-face';

const fixture = (watcher: WatcherId) => {
  const texture = new Texture();
  const material = new MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
  });
  const face = animateWatcherFace(material, watcher);
  const shader = {
    uniforms: {},
    fragmentShader: ShaderLib.standard.fragmentShader,
  } as Parameters<typeof material.onBeforeCompile>[0];
  material.onBeforeCompile(shader, {} as WebGLRenderer);
  return { face, material, texture, shader, uniforms: shader.uniforms };
};

const advance = (
  face: ReturnType<typeof animateWatcherFace>,
  seconds: number,
) => {
  for (let i = 0; i < Math.round(seconds / 0.01); i++) face.tick(0.01, true);
};

describe('watcher face animation', () => {
  it('blinks without synchronising the two characters and opens its eyes again', () => {
    const keeper = fixture('keeper');
    const overseer = fixture('overseer');
    advance(keeper.face, 2.19);
    advance(overseer.face, 2.19);
    expect(keeper.uniforms.uWatcherEyes.value.z).toBeCloseTo(0.045);
    expect(overseer.uniforms.uWatcherEyes.value.z).toBe(1);
    advance(keeper.face, 0.2);
    expect(keeper.uniforms.uWatcherEyes.value.z).toBe(1);
  });

  it('keeps the sleeping and joyful keeper artwork out of the eye deformation', () => {
    const { face, uniforms } = fixture('keeper');
    for (const action of ['rest', 'react'] as const) {
      face.setAction(action);
      advance(face, 2.2);
      expect(uniforms.uWatcherEyes.value.w).toBe(0);
    }
    face.setAction('idle');
    face.tick(0.01, true);
    expect(uniforms.uWatcherEyes.value.w).toBe(1);
  });

  it('moves the speaking mouth, pauses between phrases, and restores idle', () => {
    const { face, uniforms } = fixture('overseer');
    face.setAction('talk');
    advance(face, 0.5);
    const speaking = uniforms.uWatcherMouth.value.y;
    advance(face, 2.3);
    expect(speaking).toBeGreaterThan(0.16);
    expect(uniforms.uWatcherMouth.value.y).toBeCloseTo(0.16);
    face.setAction('idle');
    expect(uniforms.uWatcherMouth.value.toArray()).toEqual([1, 1]);
  });

  it('restores the exact static pose when animations are disabled mid-blink', () => {
    const { face, uniforms } = fixture('keeper');
    advance(face, 2.19);
    face.tick(1, false);
    expect(uniforms.uWatcherEyes.value.toArray()).toEqual([0, 0, 1, 1]);
    expect(uniforms.uWatcherMouth.value.toArray()).toEqual([1, 1]);
    face.tick(1000, false);
    expect(uniforms.uWatcherEyes.value.toArray()).toEqual([0, 0, 1, 1]);
  });

  it('reuses textures, uniforms and the shader program throughout every emotion', () => {
    const { face, material, texture, uniforms, shader } = fixture('keeper');
    const version = material.version;
    const textureVersion = texture.version;
    const eyes = uniforms.uWatcherEyes.value;
    const mouth = uniforms.uWatcherMouth.value;
    for (const action of ['idle', 'talk', 'react', 'rest'] as WatcherAction[]) {
      face.setAction(action);
      advance(face, 14);
    }
    expect(material.version).toBe(version);
    expect(texture.version).toBe(textureVersion);
    expect(material.map).toBe(texture);
    expect(material.emissiveMap).toBe(texture);
    expect(uniforms.uWatcherEyes.value).toBe(eyes);
    expect(uniforms.uWatcherMouth.value).toBe(mouth);
    // Explicit UV gradients avoid mip-map seams at the animated patches' edges.
    expect(shader.fragmentShader).toContain('textureGrad( map, watcherUv');
    expect(shader.fragmentShader).toContain(
      'textureGrad( emissiveMap, watcherUv',
    );
    expect(material.customProgramCacheKey()).toBe(
      fixture('overseer').material.customProgramCacheKey(),
    );
  });
});
