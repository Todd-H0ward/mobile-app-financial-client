// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type Rows = readonly string[];

interface Stamp {
  /** The picture pasted on top; its `.` pixels let the canvas show through. */
  sprite: Rows;
  /** Left column of the sprite on the canvas; may be negative. */
  x: number;
  /** Top row of the sprite on the canvas; may be negative. */
  y: number;
  /** Mirror left ↔ right first — the dog is drawn facing right. */
  isMirrored?: boolean;
}

interface WallOptions {
  width: number;
  height: number;
  /** Rows of wall above the floor line. */
  horizon: number;
  /** Ink of the wall blocks. */
  wall: string;
  /** Ink of the seams between blocks. */
  mortar: string;
  /** Ink of the floor. */
  floor: string;
  /** Ink of the floor's front edge and its speckle. */
  floorShade: string;
  /** Block height in pixels, seams included. */
  course?: number;
  /** Block width in pixels, seams included. */
  brick?: number;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A `width × height` canvas painted in one ink. */
export const fillCanvas = (width: number, height: number, ink: string): Rows =>
  Array.from({ length: height }, () => ink.repeat(width));

/** The same sprite facing the other way. */
export const mirror = (sprite: Rows): Rows =>
  sprite.map((row) => [...row].reverse().join(''));

/**
 * Pastes stamps onto a canvas in order, so a later stamp covers an earlier
 * one. Pixels that fall off the canvas are dropped, never wrapped.
 */
export const compose = (canvas: Rows, stamps: readonly Stamp[]): Rows => {
  const grid = canvas.map((row) => [...row]);
  for (const { sprite, x, y, isMirrored = false } of stamps) {
    const rows = isMirrored ? mirror(sprite) : sprite;
    rows.forEach((row, dy) => {
      const line = grid[y + dy];
      if (!line) return;
      [...row].forEach((ink, dx) => {
        const column = x + dx;
        if (ink === '.' || column < 0 || column >= line.length) return;
        line[column] = ink;
      });
    });
  }
  return grid.map((line) => line.join(''));
};

/**
 * The pit: a wall of blocks laid in stretcher bond down to the horizon, a
 * floor below it. Every scene of a puzzle starts from one of these.
 */
export const pitWall = ({
  width,
  height,
  horizon,
  wall,
  mortar,
  floor,
  floorShade,
  course = 6,
  brick = 12,
}: WallOptions): Rows =>
  Array.from({ length: height }, (_, y) => {
    if (y === horizon) return floorShade.repeat(width);
    if (y > horizon) {
      // A sparse, fixed speckle so the floor reads as ground, not a flat fill.
      return Array.from({ length: width }, (__, x) =>
        (x * 7 + y * 13) % 11 === 0 ? floorShade : floor,
      ).join('');
    }
    if (y % course === course - 1) return mortar.repeat(width);
    const offset = Math.floor(y / course) % 2 === 0 ? 0 : brick / 2;
    return Array.from({ length: width }, (__, x) =>
      (x + offset) % brick === brick - 1 ? mortar : wall,
    ).join('');
  });

export type { Rows, Stamp, WallOptions };
