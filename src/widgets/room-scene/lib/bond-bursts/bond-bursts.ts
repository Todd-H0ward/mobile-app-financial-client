import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Points,
  PointsMaterial,
  type Vector3,
} from 'three';

import type { BondBurst } from '@/entities/robot-dog';
import { SCENE_PALETTE } from '@/entities/scene';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface BondBursts {
  /** Spawns a short burst of the given kind above `origin`. */
  burst: (kind: BondBurst, origin: Vector3) => void;
  /** Advances every live particle. */
  tick: (deltaSec: number) => void;
  dispose: () => void;
}

interface Particle {
  /** World position. */
  x: number;
  y: number;
  z: number;
  /** Velocity. */
  vx: number;
  vy: number;
  vz: number;
  /** Seconds left to live. */
  life: number;
  /** Starting life — for fade. */
  maxLife: number;
  /** Packed RGB as 0…1 channels (written into the colour buffer). */
  r: number;
  g: number;
  b: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Hard cap so a frantic child cannot flood the GL context. */
const MAX_PARTICLES = 64;

const HEART_COLOR = new Color(SCENE_PALETTE.bondHeart);
const SPARK_COLOR = new Color(SCENE_PALETTE.spark);
const STEAM_COLOR = new Color(SCENE_PALETTE.bondSteam);

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/**
 * Short-lived points above the dog's head during bond mode.
 *
 * No textures — expo-gl would need `file://` paths, and coloured points are
 * enough for hearts / sparks / steam at this scale.
 */
const createBondBursts = (parent: Group): BondBursts => {
  const root = new Group();
  parent.add(root);

  const positions = new Float32Array(MAX_PARTICLES * 3);
  const colors = new Float32Array(MAX_PARTICLES * 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setDrawRange(0, 0);

  const material = new PointsMaterial({
    size: 10,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  root.add(points);

  const live: Particle[] = [];

  const push = (
    origin: Vector3,
    color: Color,
    count: number,
    speed: number,
    lift: number,
    life: number,
  ) => {
    for (let i = 0; i < count; i += 1) {
      if (live.length >= MAX_PARTICLES) live.shift();
      const angle = Math.random() * Math.PI * 2;
      const spread = 8 + Math.random() * 18;
      live.push({
        x: origin.x + Math.cos(angle) * spread * 0.15,
        y: origin.y,
        z: origin.z + Math.sin(angle) * spread * 0.15,
        vx: Math.cos(angle) * speed * (0.4 + Math.random()),
        vy: lift * (0.6 + Math.random() * 0.8),
        vz: Math.sin(angle) * speed * (0.4 + Math.random()),
        life,
        maxLife: life,
        r: color.r,
        g: color.g,
        b: color.b,
      });
    }
  };

  const burst = (kind: BondBurst, origin: Vector3) => {
    if (kind === 'none') return;
    if (kind === 'hearts') {
      push(origin, HEART_COLOR, 10, 12, 55, 1.1);
      return;
    }
    if (kind === 'sparks') {
      push(origin, SPARK_COLOR, 14, 40, 35, 0.7);
      return;
    }
    push(origin, STEAM_COLOR, 8, 6, 40, 1.2);
  };

  const tick = (deltaSec: number) => {
    for (let i = live.length - 1; i >= 0; i -= 1) {
      const p = live[i];
      if (!p) continue;
      p.life -= deltaSec;
      if (p.life <= 0) {
        live.splice(i, 1);
        continue;
      }
      p.x += p.vx * deltaSec;
      p.y += p.vy * deltaSec;
      p.z += p.vz * deltaSec;
      p.vy *= 1 - 0.4 * deltaSec;
    }

    for (let i = 0; i < live.length; i += 1) {
      const p = live[i];
      if (!p) continue;
      const fade = Math.max(0, p.life / p.maxLife);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      colors[i * 3] = p.r * fade;
      colors[i * 3 + 1] = p.g * fade;
      colors[i * 3 + 2] = p.b * fade;
    }
    geometry.setDrawRange(0, live.length);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  };

  const dispose = () => {
    parent.remove(root);
    geometry.dispose();
    material.dispose();
  };

  return { burst, tick, dispose };
};

export type { BondBursts };
export { createBondBursts };
