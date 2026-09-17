// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Vec2 {
  /** Horizontal, 0…1 of the playfield. */
  x: number;
  /** Vertical, 0…1 — 0 is the top, 1 is the bottom. */
  y: number;
}

interface Bullet {
  /** Stable id for React keys — position alone remounts every frame. */
  id: number;
  position: Vec2;
}

interface Target {
  /** Stable id for React keys — position alone remounts every frame. */
  id: number;
  position: Vec2;
  /** Horizontal speed in playfield units per second. */
  vx: number;
}

interface SpacewarSession {
  /** Ship centre x, 0…1. Y is fixed near the bottom. */
  shipX: number;
  bullets: readonly Bullet[];
  targets: readonly Target[];
  hits: number;
  isWon: boolean;
  /** Monotonic id source for bullets / targets. */
  nextId: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Ship vertical position — near the bottom of the field. */
export const SHIP_Y = 0.88;

export const WIN_HITS = 3;

/** Horizontal ship speed in playfield units per second. */
export const SHIP_SPEED = 0.55;

/** Bullet speed upward in playfield units per second. */
export const BULLET_SPEED = 0.9;

export const MAX_BULLETS = 3;

/** Hit radius for ship-bullet vs target (playfield units). */
export const HIT_RADIUS = 0.06;

/** Milliseconds between simulation frames in the widget. */
export const FRAME_MS = 32;

const TARGET_Y = 0.18;
const TARGET_SPEED = 0.28;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const distance = (a: Vec2, b: Vec2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const createSpacewarSession = (): SpacewarSession => ({
  shipX: 0.5,
  bullets: [],
  targets: [
    { id: 1, position: { x: 0.25, y: TARGET_Y }, vx: TARGET_SPEED },
    { id: 2, position: { x: 0.75, y: TARGET_Y }, vx: -TARGET_SPEED },
  ],
  hits: 0,
  isWon: false,
  nextId: 3,
});

/** Move the ship left (−1) or right (+1). Magnitude is ignored beyond sign. */
export const steerShip = (
  session: SpacewarSession,
  axis: number,
  dtSeconds: number,
): SpacewarSession => {
  if (session.isWon || axis === 0) return session;
  const sign = axis < 0 ? -1 : 1;
  return {
    ...session,
    shipX: clamp01(session.shipX + sign * SHIP_SPEED * dtSeconds),
  };
};

/** Fire one bullet from the ship nose when under the cap. */
export const fireBullet = (session: SpacewarSession): SpacewarSession => {
  if (session.isWon) return session;
  if (session.bullets.length >= MAX_BULLETS) return session;
  const id = session.nextId;
  return {
    ...session,
    nextId: id + 1,
    bullets: [
      ...session.bullets,
      { id, position: { x: session.shipX, y: SHIP_Y - 0.04 } },
    ],
  };
};

/**
 * Advance bullets and targets; resolve hits. Destroyed targets respawn until
 * WIN_HITS so the sitting stays short but readable.
 */
export const tickSpacewar = (
  session: SpacewarSession,
  dtSeconds: number,
): SpacewarSession => {
  if (session.isWon) return session;

  let nextId = session.nextId;

  let bullets: Bullet[] = session.bullets.map((bullet) => ({
    ...bullet,
    position: {
      x: bullet.position.x,
      y: bullet.position.y - BULLET_SPEED * dtSeconds,
    },
  }));
  bullets = bullets.filter((bullet) => bullet.position.y > -0.05);

  let targets: Target[] = session.targets.map((target) => {
    let x = target.position.x + target.vx * dtSeconds;
    let vx = target.vx;
    if (x < 0.08) {
      x = 0.08;
      vx = Math.abs(vx);
    } else if (x > 0.92) {
      x = 0.92;
      vx = -Math.abs(vx);
    }
    return { ...target, position: { x, y: target.position.y }, vx };
  });

  let hits = session.hits;
  const remainingBullets: Bullet[] = [];

  for (const bullet of bullets) {
    let consumed = false;
    targets = targets.filter((target) => {
      if (consumed) return true;
      if (distance(bullet.position, target.position) <= HIT_RADIUS) {
        consumed = true;
        hits += 1;
        return false;
      }
      return true;
    });
    if (!consumed) remainingBullets.push(bullet);
  }

  // Keep two targets on screen until the win so the child always has something
  // to aim at.
  while (targets.length < 2 && hits < WIN_HITS) {
    const fromLeft = targets.length % 2 === 0;
    const id = nextId;
    nextId += 1;
    targets = [
      ...targets,
      {
        id,
        position: { x: fromLeft ? 0.15 : 0.85, y: TARGET_Y },
        vx: fromLeft ? TARGET_SPEED : -TARGET_SPEED,
      },
    ];
  }

  const isWon = hits >= WIN_HITS;

  return {
    ...session,
    bullets: remainingBullets,
    targets: isWon ? [] : targets,
    hits,
    isWon,
    nextId,
  };
};

export type { Bullet, SpacewarSession, Target, Vec2 };
