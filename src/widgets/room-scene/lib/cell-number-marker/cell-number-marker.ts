import { type BufferGeometry, Vector3 } from 'three';

import type { LessonStatus } from '@/entities/lesson';
import { SCENE_PALETTE } from '@/entities/scene';

import { textGeometryOnPlane } from '../scene-glyphs';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Digit height in world units on the cell top.
 *
 * Tall enough that a filled stem stays readable from the opposite-bay
 * camera; a touch taller than the old stick glyphs so the mass of the
 * capsules does not crowd the rim.
 */
const DIGIT_HEIGHT = 24;

/**
 * How far inward from the rim the number sits, toward the pit centre.
 *
 * Parks the glyphs on the inner top of the tile the child reads across the pit.
 */
const LABEL_INWARD = 8;

const STATUS_COLOR: Record<LessonStatus, string> = {
  LOCKED: SCENE_PALETTE.cellFrameMuted,
  AVAILABLE: SCENE_PALETTE.cellFrame,
  CURRENT: SCENE_PALETTE.cellFrameActive,
  COMPLETED: SCENE_PALETTE.segments[1],
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const colorForLabelStatus = (status: LessonStatus): string =>
  STATUS_COLOR[status];

/**
 * World-space filled geometry for the 1-based lesson number on a cell top.
 *
 * Drawn flat on the inner rim — same plane the old stroke markers used, but
 * as solid capsules so the digits read as type rather than sticks.
 */
const cellNumberGeometry = (
  ordinal: number,
  anchor: Vector3,
  height = DIGIT_HEIGHT,
): BufferGeometry => {
  const text = String(ordinal + 1);

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

  return textGeometryOnPlane(text, origin, tangent, glyphUp, height);
};

export { cellNumberGeometry, colorForLabelStatus, DIGIT_HEIGHT };
