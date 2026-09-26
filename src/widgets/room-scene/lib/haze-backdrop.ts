import {
  BackSide,
  Color,
  type IUniform,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
} from 'three';

import {
  SCENE_PALETTE,
  SCENE_PLATFORM_Y,
  SCENE_RADIUS,
} from '@/entities/scene';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HazeBackdrop {
  mesh: Mesh;
  /** Seconds since the GL context was born — drifts the mist. */
  tick: (timeSec: number) => void;
  dispose: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Soft shell behind the arena — night void + amber smog. */
const SKY_RADIUS = SCENE_RADIUS * 2.4;

/**
 * How much the drifting mist lifts off the gradient (0…1).
 * Dense enough to read as atmosphere without washing the wedges.
 */
const HAZE_STRENGTH = 0.34;

const SKY_VERTEX = /* glsl */ `
varying vec3 vLocalPos;

void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uSkyTop;
uniform vec3 uSkyMid;
uniform vec3 uSkyHorizon;
uniform vec3 uSkyBottom;
uniform vec3 uHaze;
uniform float uHazeStrength;

varying vec3 vLocalPos;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 dir = normalize(vLocalPos);
  float h = dir.y * 0.5 + 0.5;

  // Night void → polluted horizon → black under the rim.
  vec3 sky = mix(uSkyBottom, uSkyHorizon, smoothstep(0.0, 0.42, h));
  sky = mix(sky, uSkyMid, smoothstep(0.32, 0.68, h));
  sky = mix(sky, uSkyTop, smoothstep(0.58, 1.0, h));

  // Slow sodium pulse so the smog never reads as a flat poster.
  float breath = sin(uTime * 0.14) * 0.03 + sin(uTime * 0.06 + 1.7) * 0.02;
  sky += vec3(breath * 0.6, breath * 0.25, breath * 0.1);

  // Volumetric haze: denser at the horizon and under the platform.
  vec2 mistUv = vec2(atan(dir.z, dir.x) * 0.3183 + 0.5, h);
  float n1 = fbm(mistUv * vec2(2.4, 1.5) + vec2(uTime * 0.04, uTime * 0.02));
  float n2 = fbm(mistUv * vec2(4.2, 2.6) - vec2(uTime * 0.025, -uTime * 0.032));
  float n3 = fbm(mistUv * vec2(1.2, 0.8) + vec2(uTime * 0.012, 0.4));
  float mist = smoothstep(0.22, 0.9, n1 * 0.45 + n2 * 0.35 + n3 * 0.2);
  float horizon = smoothstep(0.0, 0.62, 1.0 - abs(dir.y));
  float under = smoothstep(0.55, 0.15, h);
  float haze = mist * max(horizon, under * 0.7) * uHazeStrength;

  sky = mix(sky, uHaze, haze);

  // Soft glow band just above the horizon — distant city light bleed.
  float glowBand = smoothstep(0.38, 0.48, h) * (1.0 - smoothstep(0.48, 0.58, h));
  sky += uHaze * glowBand * 0.22;

  gl_FragColor = vec4(sky, 1.0);
}
`;

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/**
 * Inward sky sphere: Blade Runner void + amber particulate haze.
 * One draw call, no post-process (those melt mid-range Android).
 */
const createHazeBackdrop = (): HazeBackdrop => {
  const uniforms: Record<string, IUniform> = {
    uTime: { value: 0 },
    uSkyTop: { value: new Color(SCENE_PALETTE.skyTop) },
    uSkyMid: { value: new Color(SCENE_PALETTE.skyMid) },
    uSkyHorizon: { value: new Color(SCENE_PALETTE.skyHorizon) },
    uSkyBottom: { value: new Color(SCENE_PALETTE.skyBottom) },
    uHaze: { value: new Color(SCENE_PALETTE.haze) },
    uHazeStrength: { value: HAZE_STRENGTH },
  };

  const material = new ShaderMaterial({
    uniforms,
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    // Opaque sky: mist is painted into the backdrop only, never as a
    // transparent pass over the arena.
    depthWrite: false,
    depthTest: false,
    side: BackSide,
    fog: false,
  });

  const geometry = new SphereGeometry(SKY_RADIUS, 32, 20);
  const mesh = new Mesh(geometry, material);
  mesh.position.y = SCENE_PLATFORM_Y;
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;

  return {
    mesh,
    tick: (timeSec) => {
      uniforms.uTime.value = timeSec;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};

export type { HazeBackdrop };
export { createHazeBackdrop };
