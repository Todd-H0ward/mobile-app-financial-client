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

/** The version of `target` that lies within half a turn of `current`. */
const alignAngle = (current: number, target: number): number => {
  const delta = normalizeAngle(target - current);
  return current + (delta > HALF_TURN ? delta - FULL_TURN : delta);
};

/** Shortest distance between two headings, `0 … 180`. */
const angleDistance = (from: number, to: number): number => {
  const delta = normalizeAngle(to - from);
  return delta > HALF_TURN ? FULL_TURN - delta : delta;
};

/** Camera position for a heading and a height above the floor. */
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

/** How far back the camera has to stand for a sphere to fit on screen. */
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

/** Frame-rate independent easing towards a target. */
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
