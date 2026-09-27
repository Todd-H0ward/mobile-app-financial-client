// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Cells in a full terrace of one bay.
 *
 * Not a number this code chose: the FBX ring holds eighteen discs between
 * three gear slots, six to a bay. The app now builds the cells itself, and a
 * bay may end on a shorter row (`arenaLayout`), but six is still how many a
 * full row carries and how wide each of them is drawn.
 */
const SCENE_CELLS_PER_STEP = 6;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SceneCell {
  /** Which room it belongs to, `0 … SCENE_SEGMENT_COUNT - 1`. */
  segment: number;
  /** Which terrace, `0` innermost and lowest. */
  step: number;
  /**
   * Where it sits along the arc, left to right: `0 … SCENE_CELLS_PER_STEP - 1`
   * on a full row, fewer on a bay's short top row.
   */
  cell: number;
}

export type { SceneCell };
export { SCENE_CELLS_PER_STEP };
