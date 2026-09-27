import { type BufferGeometry, Vector3 } from 'three';

import type { LessonStatus } from '@/entities/lesson';
import { SCENE_PALETTE } from '@/entities/scene';

import { textGeometryOnPlane, textGeometryUpright } from '../scene-glyphs';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Digit height in world units on the cell top. */
const DIGIT_HEIGHT = 24;

/** Digit height on a cell's front, in world units. */
const FRONT_DIGIT_HEIGHT = 22;

/** How far in front of the wall the digits float, so they never z-fight it. */
const FRONT_LIFT = 1.5;

const LABEL_INWARD = 8;

const STATUS_COLOR: Record<LessonStatus, string> = {
  LOCKED: SCENE_PALETTE.cellFrameMuted,
  AVAILABLE: SCENE_PALETTE.cellFrame,
  CURRENT: SCENE_PALETTE.cellFrameActive,
  COMPLETED: SCENE_PALETTE.cellDone,
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const colorForLabelStatus = (status: LessonStatus): string =>
  STATUS_COLOR[status];

/** World-space filled geometry for the 1-based lesson number on a cell top. */
const cellNumberGeometry = (
  ordinal: number,
  anchor: Vector3,
  height = DIGIT_HEIGHT,
  up?: Vector3,
): BufferGeometry => {
  const text = String(ordinal + 1);

  const radial = new Vector3(anchor.x, 0, anchor.z);
  if (radial.lengthSq() < 1e-6) radial.set(0, 0, 1);
  else radial.normalize();

  const glyphUp =
    up && up.lengthSq() > 1e-6
      ? new Vector3(up.x, 0, up.z).normalize()
      : radial;
  const tangent = new Vector3(-glyphUp.z, 0, glyphUp.x);
  // Nudged toward the axis, off the rim the frame runs along.
  const origin = new Vector3(
    anchor.x - radial.x * LABEL_INWARD,
    anchor.y,
    anchor.z - radial.z * LABEL_INWARD,
  );

  return textGeometryOnPlane(text, origin, tangent, glyphUp, height);
};

/**
 * The lesson number standing on a cell's front — the wall that faces the axis, which is
 * what a camera across the pit actually sees.
 */
const cellFrontNumberGeometry = (
  ordinal: number,
  heading: number,
  radius: number,
  y: number,
  height = FRONT_DIGIT_HEIGHT,
): BufferGeometry => {
  const radians = (heading * Math.PI) / 180;
  const outward = new Vector3(Math.sin(radians), 0, Math.cos(radians));
  // Looking out along `outward`, screen right is outward × up.
  const right = new Vector3(-outward.z, 0, outward.x);
  const origin = outward.clone().multiplyScalar(radius - FRONT_LIFT);
  origin.y = y;
  return textGeometryUpright(String(ordinal + 1), origin, right, height);
};

export {
  cellFrontNumberGeometry,
  cellNumberGeometry,
  colorForLabelStatus,
  DIGIT_HEIGHT,
  FRONT_DIGIT_HEIGHT,
};
