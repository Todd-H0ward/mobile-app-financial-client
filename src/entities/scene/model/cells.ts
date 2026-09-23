// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Cells in one terrace of one room.
 *
 * Not a number this code chose: the FBX holds 90 discs, and they divide
 * exactly into three rooms × five terraces × six cells. The arcade, the
 * chores and the shop all get laid out on these, so the count is read off
 * the model rather than decided here — `source.test.ts` asserts the model
 * still says six.
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
  /** Where it sits along the arc, `0 … SCENE_CELLS_PER_STEP - 1`, left to right. */
  cell: number;
}

export type { SceneCell };
export { SCENE_CELLS_PER_STEP };
