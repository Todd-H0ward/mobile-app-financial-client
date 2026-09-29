import { ARCADE_SPRITES } from '../sheet/arcade';
import { CHARACTER_SPRITES } from '../sheet/characters';
import { SHOP_SPRITES } from '../sheet/shop';
import { TOY_SPRITES } from '../sheet/toys';

// ═══════════════════════════════════════════
// SPRITES
// ═══════════════════════════════════════════

/**
 * The game's pixel art. One string per row, one character per pixel: `.` is
 * transparent, every other character is an ink from `SPRITE_PALETTE`. The
 * sheet is data, not images, so a sprite is edited in a diff and costs
 * nothing in the bundle. Icons are 16×16; the whole dog is larger.
 */
export const SPRITES = {
  ...ARCADE_SPRITES,
  ...CHARACTER_SPRITES,
  ...SHOP_SPRITES,
  ...TOY_SPRITES,
} as const satisfies Record<string, readonly string[]>;

type SpriteName = keyof typeof SPRITES;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Content names a sprite as a plain string; this is how it is checked. */
export const isSpriteName = (value: unknown): value is SpriteName =>
  typeof value === 'string' && Object.hasOwn(SPRITES, value);

export type { SpriteName };
