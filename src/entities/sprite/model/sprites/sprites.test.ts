import { describe, expect, it } from 'vitest';

import { SPRITE_PALETTE } from '../palette';
import { ARCADE_SPRITES } from '../sheet/arcade';
import { SHOP_SPRITES } from '../sheet/shop';
import { TOY_SPRITES } from '../sheet/toys';

import { isSpriteName, SPRITES } from './sprites';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const ICON_SIDE = 16;

/** Sheets whose every sprite sits in a list row or a chip, so shares one size. */
const ICON_SHEETS = { ...ARCADE_SPRITES, ...SHOP_SPRITES, ...TOY_SPRITES };

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('the sprite sheet', () => {
  it('draws every sprite as a rectangle', () => {
    for (const [name, rows] of Object.entries(SPRITES)) {
      const widths = new Set(rows.map((row) => row.length));
      expect({ name, widths: [...widths] }).toEqual({
        name,
        widths: [rows[0]?.length],
      });
    }
  });

  it('draws icons on a 16×16 grid', () => {
    for (const [name, rows] of Object.entries(ICON_SHEETS)) {
      expect({ name, size: [rows[0]?.length, rows.length] }).toEqual({
        name,
        size: [ICON_SIDE, ICON_SIDE],
      });
    }
  });

  it('paints only with inks from the palette', () => {
    const inks = new Set(['.', ...Object.keys(SPRITE_PALETTE)]);
    for (const [name, rows] of Object.entries(SPRITES)) {
      const unknown = [...rows.join('')].filter((ink) => !inks.has(ink));
      expect({ name, unknown }).toEqual({ name, unknown: [] });
    }
  });

  it('never leaves a sprite blank', () => {
    for (const [name, rows] of Object.entries(SPRITES)) {
      expect({ name, isBlank: /^\.*$/.test(rows.join('')) }).toEqual({
        name,
        isBlank: false,
      });
    }
  });

  it('never lets two sheets claim the same name', () => {
    const parts = [ARCADE_SPRITES, SHOP_SPRITES, TOY_SPRITES];
    const total = parts.reduce(
      (sum, part) => sum + Object.keys(part).length,
      0,
    );
    expect(Object.keys(ICON_SHEETS)).toHaveLength(total);
  });
});

describe('isSpriteName', () => {
  it('knows the sheet and nothing else', () => {
    expect(isSpriteName('coin')).toBe(true);
    expect(isSpriteName('toString')).toBe(false);
    expect(isSpriteName('')).toBe(false);
    expect(isSpriteName(7)).toBe(false);
  });
});
