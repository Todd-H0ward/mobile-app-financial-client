import { Vector3 } from 'three';

import type { LessonStatus } from '@/entities/lesson';
import { SCENE_PALETTE } from '@/entities/scene';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Digit height in world units on the cell top.
 *
 * Matches the scale of the old status markers (~12) but a bit taller so a
 * 1–2 digit lesson number stays readable from the segment camera.
 */
const DIGIT_HEIGHT = 22;

/** Gap between digits. */
const DIGIT_GAP = 4;

/**
 * How far inward from the rim the number sits, toward the pit centre.
 *
 * Parks the strokes on the inner top of the tile the child reads across the pit.
 */
const LABEL_INWARD = 8;

const STATUS_COLOR: Record<LessonStatus, string> = {
  LOCKED: SCENE_PALETTE.cellFrameMuted,
  AVAILABLE: SCENE_PALETTE.cellFrame,
  CURRENT: SCENE_PALETTE.cellFrameActive,
  COMPLETED: SCENE_PALETTE.segments[1],
};

/**
 * Polyline strokes for `0…9` in a 5×8 box (x right, y up in glyph space).
 *
 * Same drawing path as the old status markers — `LineSegments` flat on the
 * cell top is what this GL stack actually shows.
 */
const DIGIT_STROKES: Record<
  string,
  ReadonlyArray<readonly [number, number, number, number]>
> = {
  '0': [
    [0, 0, 5, 0],
    [5, 0, 5, 8],
    [5, 8, 0, 8],
    [0, 8, 0, 0],
  ],
  '1': [
    [2.5, 0, 2.5, 8],
    [1, 6.5, 2.5, 8],
  ],
  '2': [
    [0, 8, 5, 8],
    [5, 8, 5, 4],
    [5, 4, 0, 4],
    [0, 4, 0, 0],
    [0, 0, 5, 0],
  ],
  '3': [
    [0, 8, 5, 8],
    [5, 8, 5, 0],
    [5, 0, 0, 0],
    [1, 4, 5, 4],
  ],
  '4': [
    [0, 8, 0, 4],
    [0, 4, 5, 4],
    [5, 8, 5, 0],
  ],
  '5': [
    [5, 8, 0, 8],
    [0, 8, 0, 4],
    [0, 4, 5, 4],
    [5, 4, 5, 0],
    [5, 0, 0, 0],
  ],
  '6': [
    [5, 8, 0, 8],
    [0, 8, 0, 0],
    [0, 0, 5, 0],
    [5, 0, 5, 4],
    [5, 4, 0, 4],
  ],
  '7': [
    [0, 8, 5, 8],
    [5, 8, 2, 0],
  ],
  '8': [
    [0, 0, 5, 0],
    [5, 0, 5, 8],
    [5, 8, 0, 8],
    [0, 8, 0, 0],
    [0, 4, 5, 4],
  ],
  '9': [
    [0, 0, 5, 0],
    [5, 0, 5, 8],
    [5, 8, 0, 8],
    [0, 8, 0, 4],
    [0, 4, 5, 4],
  ],
};

/** Eight segments kept per digit so buffer ranges stay stable. */
const STROKES_PER_DIGIT = 8;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const colorForLabelStatus = (status: LessonStatus): string =>
  STATUS_COLOR[status];

/**
 * World-space line endpoints for the 1-based lesson number on a cell top.
 *
 * Drawn flat on the inner rim (same plane as the old status markers).
 */
const cellNumberLines = (
  ordinal: number,
  anchor: Vector3,
  height = DIGIT_HEIGHT,
): number[] => {
  const text = String(ordinal + 1);
  const scale = height / 8;
  const digitWidth = 5 * scale;
  const gap = DIGIT_GAP;
  const totalWidth =
    text.length * digitWidth + Math.max(0, text.length - 1) * gap;

  const radial = new Vector3(anchor.x, 0, anchor.z);
  if (radial.lengthSq() < 1e-6) radial.set(0, 0, 1);
  else radial.normalize();

  // Top of the glyph points outward so the number reads upright from the
  // opposite-bay camera (looking in across the pit).
  const glyphUp = radial;
  const tangent = new Vector3(-radial.z, 0, radial.x);
  const origin = new Vector3(
    anchor.x - radial.x * LABEL_INWARD,
    anchor.y,
    anchor.z - radial.z * LABEL_INWARD,
  );

  const values: number[] = [];
  const write = (lx: number, ly: number, mx: number, my: number) => {
    const ax = origin.x + tangent.x * lx + glyphUp.x * ly;
    const ay = origin.y;
    const az = origin.z + tangent.z * lx + glyphUp.z * ly;
    const bx = origin.x + tangent.x * mx + glyphUp.x * my;
    const by = origin.y;
    const bz = origin.z + tangent.z * mx + glyphUp.z * my;
    values.push(ax, ay, az, bx, by, bz);
  };

  let cursor = -totalWidth / 2;
  for (const char of text) {
    const strokes = DIGIT_STROKES[char] ?? DIGIT_STROKES['0'];
    for (let i = 0; i < STROKES_PER_DIGIT; i += 1) {
      const [x1, y1, x2, y2] = strokes[i] ?? [0, 0, 0, 0];
      write(cursor + x1 * scale, y1 * scale, cursor + x2 * scale, y2 * scale);
    }
    cursor += digitWidth + gap;
  }

  return values;
};

/** Floats per lesson number: digits × 8 segments × 2 points × 3 axes. */
const numberLineFloats = (ordinal: number): number =>
  String(ordinal + 1).length * STROKES_PER_DIGIT * 6;

export { cellNumberLines, colorForLabelStatus, DIGIT_HEIGHT, numberLineFloats };
