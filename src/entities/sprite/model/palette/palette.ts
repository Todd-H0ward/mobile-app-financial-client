// ═══════════════════════════════════════════
// PALETTE
// ═══════════════════════════════════════════

/**
 * Colours of the game's pixel art, one character per ink. The sprites are
 * the world's own art — rusted steel, coins, the robot's coat — so, like the
 * arena's palette, they live with the entity and not in the design system.
 * `.` is not listed: it is the transparent pixel.
 */
export const SPRITE_PALETTE = {
  /** Outline — every sprite is drawn with it, so it reads on any screen. */
  k: '#1A1414',
  /** Paper and glints. */
  w: '#F6F1E6',
  /** Steel, light → dark. */
  l: '#C4C6BC',
  m: '#8A8F86',
  d: '#50564F',
  /** Coin gold, glint → deep shade. */
  Y: '#FFF0B8',
  y: '#F2C879',
  o: '#D0913F',
  O: '#8E5A22',
  /** Alarm red and its shade. */
  r: '#F07167',
  R: '#A83E38',
  /** Sticker pink and its shade. */
  p: '#F7A8B8',
  q: '#D9788E',
  /** Phosphor green, the charge colour. */
  G: '#9EF0A8',
  g: '#4E8C5E',
  h: '#2B5A3A',
  /** Glass and the Keeper's blue. */
  B: '#9ED8F6',
  b: '#4A8CC0',
  n: '#2C5A84',
  /** Rust, the arena's own. */
  u: '#C8743E',
  U: '#7E4424',
  /** Bread crust and wood. */
  c: '#EBC286',
  C: '#A56A36',
  /** Violet paint. */
  v: '#C3A2EE',
  V: '#7656B0',
  /** The robot dog's teal coat and its visor. */
  t: '#3F7A66',
  T: '#24483C',
  a: '#FFB257',
} as const;

type SpriteInk = keyof typeof SPRITE_PALETTE;

export type { SpriteInk };
