// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface OrbitPosition {
  x: number;
  y: number;
  z: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const RADIANS = Math.PI / 180;

const FULL_TURN = 360;

const HALF_TURN = 180;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Folds any angle into `0 … 360`, so two headings can be compared. */
const normalizeAngle = (angle: number): number =>
  ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;

/**
 * The version of `target` that lies within half a turn of `current`.
 *
 * Animating from 350° to 10° must take the 20° road, not the 340° one, and
 * the camera keeps an unwrapped angle so a drag can pass 0 without a jump.
 */
const alignAngle = (current: number, target: number): number => {
  const delta = normalizeAngle(target - current);
  return current + (delta > HALF_TURN ? delta - FULL_TURN : delta);
};

/** Shortest distance between two headings, `0 … 180`. */
const angleDistance = (from: number, to: number): number => {
  const delta = normalizeAngle(to - from);
  return delta > HALF_TURN ? FULL_TURN - delta : delta;
};

/**
 * Camera position for a heading and a height above the floor.
 *
 * The azimuth is measured the way the model's own segment angles are —
 * `atan2(x, z)` — so parking at a segment's angle puts the camera in front of
 * that room rather than behind it.
 */
const orbitPosition = (
  azimuth: number,
  elevation: number,
  distance: number,
): OrbitPosition => {
  const flat = Math.cos(elevation * RADIANS) * distance;

  return {
    x: Math.sin(azimuth * RADIANS) * flat,
    y: Math.sin(elevation * RADIANS) * distance,
    z: Math.cos(azimuth * RADIANS) * flat,
  };
};

/**
 * How far back the camera has to stand for a sphere to fit on screen.
 *
 * A phone held upright is much narrower than it is tall, so the width decides
 * the framing, not the field of view the camera was given. Reading the aspect
 * at render time is what keeps the arena whole on a tall phone and on a
 * tablet — there is no scaling layer to do it (AGENTS.md).
 */
const fitDistance = (
  radius: number,
  fov: number,
  aspect: number,
  margin = 1,
): number => {
  const vertical = (fov / 2) * RADIANS;
  const horizontal = Math.atan(Math.tan(vertical) * aspect);

  return (radius * margin) / Math.sin(Math.min(vertical, horizontal));
};

/** Which room the camera is pointing at right now. */
const nearestSegment = (azimuth: number, angles: number[]): number => {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  angles.forEach((angle, index) => {
    const distance = angleDistance(azimuth, angle);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });

  return best;
};

/**
 * Frame-rate independent easing towards a target.
 *
 * `smoothing` is the share of the remaining distance still left after one
 * second, so the motion looks the same at 60 and at 120 frames.
 */
const damp = (
  current: number,
  target: number,
  smoothing: number,
  delta: number,
): number => current + (target - current) * (1 - smoothing ** delta);

export type { OrbitPosition };
export {
  alignAngle,
  angleDistance,
  damp,
  fitDistance,
  nearestSegment,
  normalizeAngle,
  orbitPosition,
};
