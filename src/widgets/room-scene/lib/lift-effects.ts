import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  NormalBlending,
  Points,
  ShaderMaterial,
  type Vector3,
} from 'three';

import { SCENE_PALETTE } from '@/entities/scene';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LiftEffects {
  /**
   * Fires one level's worth of VFX.
   *
   * @param ringRadius where the ring that just landed meets the floor
   */
  burst: (ringRadius: number) => void;
  /** Advances every burst — call once per frame with the frame delta. */
  tick: (deltaSec: number) => void;
  dispose: () => void;
}

interface BurstOptions {
  count: number;
  /** Seconds a grain lives. */
  life: number;
  /** Share of the life over which births are spread, `0 … 1`. */
  stagger: number;
  /** Upward throw, in world units per second. */
  rise: number;
  /** Outward throw, same units. */
  spread: number;
  /** Pull downwards, in units per second squared. */
  gravity: number;
  /** Grain size at birth, in world units — not pixels. */
  size: number;
  color: string;
  isAdditive: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Grit kicked up where the ring lands.
 *
 * Slow, wide and plentiful: it sells the weight of a stone ring dropping a
 * step, which is the whole point of the animation.
 */
const RING_DUST: BurstOptions = {
  count: 240,
  life: 1.6,
  stagger: 0.3,
  rise: 70,
  spread: 120,
  gravity: 110,
  size: 22,
  color: SCENE_PALETTE.dust,
  isAdditive: false,
};

/**
 * Sparks off the same impact — fast, tight and brief.
 *
 * Fewer than the dust on purpose: sparks read as stone striking stone, and a
 * shower of them would read as fireworks.
 */
const RING_SPARKS: BurstOptions = {
  count: 90,
  life: 0.8,
  stagger: 0.2,
  rise: 230,
  spread: 80,
  gravity: 520,
  size: 9,
  color: SCENE_PALETTE.spark,
  isAdditive: true,
};

/**
 * Sparks off the gear teeth.
 *
 * Spread over most of their life rather than thrown at once: the wheels turn
 * for the whole two seconds of a level, so they should sputter throughout
 * instead of flashing once at the start.
 */
const GEAR_SPARKS: BurstOptions = {
  count: 150,
  life: 1.9,
  stagger: 0.75,
  rise: 150,
  spread: 110,
  gravity: 420,
  size: 10,
  color: SCENE_PALETTE.spark,
  isAdditive: true,
};

/** How far from a wheel's hub its teeth are, in world units. */
const GEAR_TOOTH_RADIUS = 150;

/**
 * Turns a world size into pixels at a given depth.
 *
 * `viewportHeight / (2 · tan(fov/2))`, with the 2400-pixel phone and the 45°
 * lens this scene uses. Written down rather than plumbed through as a uniform
 * because it only has to be right to within a grain of dust — but it does
 * have to be roughly right: the camera sits two and a half thousand units
 * back, and the arbitrary constant this replaced drew three-pixel specks.
 */
const POINT_SCALE = 2900;

/** Born a little clear of the floor, or the first frames are inside it. */
const BIRTH_LIFT = 12;

/**
 * Every grain is born once and simulated on the GPU.
 *
 * Nothing about a burst changes between frames except one number, so a grain
 * is a position, a velocity and a clock: the JS thread advances `uTime` and
 * does no per-grain work at all. The render loop here is already on the JS
 * thread (docs/scene.md), and five hundred grains of per-frame maths there
 * would cost the frame the camera needs.
 *
 * `aOrigin` is a direction on the unit circle for the ring bursts, scaled by
 * `uRadius` so one buffer serves every ring, and an absolute position for the
 * gear sparks, which stand where their wheels do.
 */
const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uLife;
  uniform float uStagger;
  uniform float uSize;
  uniform float uGravity;
  uniform float uRadius;
  uniform float uPointScale;

  attribute vec3 aOrigin;
  attribute vec3 aVelocity;
  attribute float aSeed;

  varying float vFade;

  void main() {
    // Stagger the births so a burst arrives as a cloud, not as a wall.
    float birth = aSeed * uStagger * uLife;
    float age = uTime - birth;
    vFade = clamp(1.0 - age / uLife, 0.0, 1.0);

    vec3 start = vec3(aOrigin.x * uRadius, aOrigin.y, aOrigin.z * uRadius);
    vec3 offset = aVelocity * age;
    offset.y -= 0.5 * uGravity * age * age;

    vec4 view = modelViewMatrix * vec4(start + offset, 1.0);
    gl_Position = projectionMatrix * view;
    // Grains shrink as they die, and near ones read bigger than far ones.
    gl_PointSize = uSize * vFade * (uPointScale / -view.z);

    // A grain not yet born, or already spent, is pushed off screen rather
    // than drawn: there is no branch cheaper than this one.
    if (age < 0.0 || vFade <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;

  varying float vFade;

  void main() {
    // Square points into soft round grains.
    vec2 fromCenter = gl_PointCoord - vec2(0.5);
    float edge = dot(fromCenter, fromCenter);
    if (edge > 0.25) discard;

    float softness = 1.0 - smoothstep(0.0, 0.25, edge);
    gl_FragColor = vec4(uColor, vFade * softness);
  }
`;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * One burst system.
 *
 * `hubs` empty means a ring burst: grains are born on a unit circle the
 * shader scales to whatever ring just landed. Otherwise the grains are split
 * between the hubs — the three wheels — and stay where those stand.
 */
const createBurst = (options: BurstOptions, hubs: Vector3[] = []): Points => {
  const origins = new Float32Array(options.count * 3);
  const velocities = new Float32Array(options.count * 3);
  const seeds = new Float32Array(options.count);
  const isRing = hubs.length === 0;

  for (let i = 0; i < options.count; i += 1) {
    const angle = Math.random() * Math.PI * 2;

    if (isRing) {
      // A unit direction: the shader multiplies it by the ring's radius.
      origins[i * 3] = Math.cos(angle);
      origins[i * 3 + 1] = BIRTH_LIFT;
      origins[i * 3 + 2] = Math.sin(angle);
    } else {
      const hub = hubs[i % hubs.length];
      // Somewhere on the wheel's rim, where teeth would be meeting.
      const around = Math.random() * Math.PI * 2;
      origins[i * 3] = hub.x + Math.cos(around) * GEAR_TOOTH_RADIUS * 0.4;
      origins[i * 3 + 1] = hub.y + Math.sin(around) * GEAR_TOOTH_RADIUS;
      origins[i * 3 + 2] = hub.z + Math.cos(around) * GEAR_TOOTH_RADIUS * 0.4;
    }

    const outwards = options.spread * (0.3 + Math.random() * 0.7);
    velocities[i * 3] = Math.cos(angle) * outwards;
    velocities[i * 3 + 1] = options.rise * (0.4 + Math.random());
    velocities[i * 3 + 2] = Math.sin(angle) * outwards;

    seeds[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  // `position` is never read by the shader, but three needs the attribute to
  // size the draw and to build a bounding sphere.
  geometry.setAttribute('position', new BufferAttribute(origins, 3));
  geometry.setAttribute('aOrigin', new BufferAttribute(origins, 3));
  geometry.setAttribute('aVelocity', new BufferAttribute(velocities, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));

  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLife: { value: options.life },
      uStagger: { value: options.stagger },
      uSize: { value: options.size },
      uGravity: { value: options.gravity },
      uRadius: { value: 1 },
      uPointScale: { value: POINT_SCALE },
      uColor: { value: new Color(options.color) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: options.isAdditive ? AdditiveBlending : NormalBlending,
  });

  const points = new Points(geometry, material);
  points.visible = false;
  // The cloud is far wider than the ring it is born on, and a frustum test on
  // the birth ring alone pops the whole burst out of view at the screen edge.
  points.frustumCulled = false;

  return points;
};

const uniformsOf = (points: Points) =>
  (points.material as ShaderMaterial).uniforms;

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/**
 * Dust and sparks for one level of the climb.
 *
 * Two impacts happen at once and both are worth showing: the ring lands on
 * the floor, and the wheels that drove it down grind while it does.
 */
const createLiftEffects = (mount: Group, gearHubs: Vector3[]): LiftEffects => {
  const ringDust = createBurst(RING_DUST);
  const ringSparks = createBurst(RING_SPARKS);
  const gearSparks = createBurst(GEAR_SPARKS, gearHubs);
  const bursts = [ringDust, ringSparks, gearSparks];

  for (const burst of bursts) mount.add(burst);

  const longestLife =
    Math.max(RING_DUST.life, RING_SPARKS.life, GEAR_SPARKS.life) * 1.8;
  let elapsed = 0;
  let isRunning = false;

  return {
    burst: (ringRadius) => {
      elapsed = 0;
      isRunning = true;

      uniformsOf(ringDust).uRadius.value = ringRadius;
      uniformsOf(ringSparks).uRadius.value = ringRadius;

      for (const points of bursts) {
        points.visible = true;
        uniformsOf(points).uTime.value = 0;
      }
    },
    tick: (deltaSec) => {
      if (!isRunning) return;

      elapsed += deltaSec;
      for (const points of bursts) {
        uniformsOf(points).uTime.value = elapsed;
      }

      if (elapsed < longestLife) return;
      // Spent: stop drawing five hundred discarded points every frame.
      isRunning = false;
      for (const points of bursts) points.visible = false;
    },
    dispose: () => {
      for (const points of bursts) {
        mount.remove(points);
        points.geometry.dispose();
        (points.material as ShaderMaterial).dispose();
      }
    },
  };
};

export type { LiftEffects };
export { createLiftEffects };
