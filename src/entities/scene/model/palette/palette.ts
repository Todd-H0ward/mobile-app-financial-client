// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The model's own colours — art data, not design tokens.
 *
 * Smash Hit–style soft sky behind flat Phong wedges. The FBX still carries no
 * materials and no textures. This file remains the only place in the slice
 * allowed to write a hex (AGENTS.md); a test asserts it.
 */
const SCENE_PALETTE = {
  /**
   * The three wedges, in `segmentAngles` order: street, living, kitchen.
   *
   * Saturated accents against the washed sky — crystal-bright, not alley neon.
   */
  segments: ['#E85A7A', '#2EC4C8', '#E8C547'],
  /** Dimmed version of the same wedge while the camera looks elsewhere. */
  segmentsMuted: ['#C4788A', '#6AADB0', '#C4B06A'],
  /** Whatever stands on the axis and belongs to no room. */
  shared: '#9B7EBD',
  /** Grit thrown off the rim when the platform climbs out of the pit. */
  dust: '#C9B08A',
  /** The gear train straining — brief, bright, drawn additively. */
  spark: '#FFD27A',
  /** Soft warm key — Smash Hit corridor light. */
  keyLight: '#FFF4E6',
  /** Cool sky bounce on the shaded side. */
  fillLight: '#C5DCE8',
  /** Soft ambient fill. */
  ambientLight: '#D0DCE6',
  /** Hemisphere sky. */
  hemisphereSky: '#E2F2FA',
  /** Hemisphere ground bounce. */
  hemisphereGround: '#B8C4C8',
  /** Soft white lamp above the arena centre. */
  centreLight: '#FFFFFF',
  /** Soft Phong highlight. */
  specular: '#E8F4FF',
  /** Gradient sky — zenith. */
  skyTop: '#D4EEF8',
  /** Gradient sky — upper mid. */
  skyMid: '#9EC9DC',
  /** Gradient sky — horizon band (cool lavender-teal). */
  skyHorizon: '#A8B8D4',
  /** Gradient sky — below the horizon. */
  skyBottom: '#6E8FA8',
  /** Drifting mist tint over the sky. */
  haze: '#EAF6FC',
  /** GL clear fallback while the sky sphere boots. */
  background: '#9EC9DC',
} as const;

export { SCENE_PALETTE };
