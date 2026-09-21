// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The model's own colours — art data, not design tokens.
 *
 * The FBX carries no materials, so the look is decided here. This is the one
 * file in the slice allowed to write a hex (AGENTS.md); a test asserts it.
 */
const SCENE_PALETTE = {
  /**
   * The three wedges, in `segmentAngles` order: street, living, kitchen.
   *
   * Saturated on purpose: the app's background is cream, and a pastel lit by
   * the key light comes out near-white — the model then disappears into the
   * page instead of standing on it.
   */
  segments: ['#E09A5A', '#6FA8CC', '#84B36E'],
  /** Dimmed version of the same wedge while the camera looks elsewhere. */
  segmentsMuted: ['#C49375', '#8AA2B2', '#93AA84'],
  /** Whatever stands on the axis and belongs to no room. */
  shared: '#B8A387',
  /** Key light, warm, from above and slightly to the front. */
  keyLight: '#FFF6E8',
  /** Cool bounce so the shaded side never goes flat black. */
  fillLight: '#9FB6C8',
  /** Ambient wash. */
  ambientLight: '#FFFFFF',
} as const;

export { SCENE_PALETTE };
