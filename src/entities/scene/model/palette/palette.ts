// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The model's own colours — art data, not design tokens.
 *
 * Blade Runner night + Smash Hit solids + brutalist concrete — a step brighter
 * so the pit reads through the amber haze without going candy. Soft Phong
 * wedges; no textures in the FBX. This file remains the only place in the
 * slice allowed to write a hex (AGENTS.md); a test asserts it.
 */
const SCENE_PALETTE = {
  /**
   * The three wedges, in `segmentAngles` order.
   *
   * Brutalist slabs: cold slate, oxidized steel, rusted concrete — lifted a
   * notch so emissive glow and haze stay readable.
   */
  segments: ['#4E5A68', '#3A5256', '#5E4A40'],
  /** Dimmed twin while the camera looks elsewhere. */
  segmentsMuted: ['#343C48', '#28383C', '#403028'],
  /** Axis gears — dark machined metal. */
  shared: '#3A424C',
  /** Outline around every cell — cool steel rim. */
  cellFrame: '#A8B8C8',
  /** The same outline in a bay the camera is not looking at. */
  cellFrameMuted: '#5A6674',
  /** Selected cell — sodium-amber neon, not pastel gold. */
  cellFrameActive: '#FFC45A',
  /** Map-HUD panel face — dark slab under the overhead shot. */
  hudPanel: '#1A2030',
  /** Map-HUD panel thickness. */
  hudPanelSide: '#121820',
  /** Map-HUD panel rim. */
  hudPanelEdge: '#4A5668',
  /** Map-HUD ink for digits and icons. */
  hudInk: '#E4EAF2',
  /** Battery fill when the charge is healthy. */
  hudBattery: '#4ADADA',
  /** Battery fill when the charge is low — amber, never alarm red. */
  hudBatteryLow: '#F0B04A',
  /** Grit thrown off the rim when the platform climbs. */
  dust: '#7A6A54',
  /** Gear-train sparks — brief, additive, hot. */
  spark: '#FFD06A',
  /** Warm sodium key — streetlight over the pit. */
  keyLight: '#FFE0B8',
  /** Cool cyber fill on the shaded side. */
  fillLight: '#5A7A9A',
  /** Ambient — lifted so concrete stays readable. */
  ambientLight: '#4A5A74',
  /** Hemisphere sky — brighter dusk air. */
  hemisphereSky: '#4A6888',
  /** Hemisphere ground — warm smog bounce. */
  hemisphereGround: '#4A3824',
  /** Soft lamp above the arena centre. */
  centreLight: '#FFF4E4',
  /** Cool Phong highlight on concrete. */
  specular: '#C8DCF0',
  /** Gradient sky — zenith (lit dusk, not void). */
  skyTop: '#2A4868',
  /** Gradient sky — upper mid. */
  skyMid: '#3A6090',
  /** Gradient sky — polluted amber horizon. */
  skyHorizon: '#8A6040',
  /** Gradient sky — below the rim. */
  skyBottom: '#345068',
  /** Drifting particulate haze — amber smog. */
  haze: '#F8B070',
  /** GL clear fallback while the sky sphere boots. */
  background: '#345868',
} as const;

export { SCENE_PALETTE };
