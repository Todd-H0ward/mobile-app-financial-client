import { describe, expect, it } from 'vitest';

import { SPRITE_PALETTE } from './palette';

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const SLICE = join(__dirname, '..', '..');

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

/** Every source file of the sprite entity except the palette itself. */
const sliceFiles = (folder: string): string[] =>
  readdirSync(folder).flatMap((entry) => {
    const path = join(folder, entry);
    if (statSync(path).isDirectory()) return sliceFiles(path);
    return /\.tsx?$/.test(path) && !path.endsWith('palette.ts') ? [path] : [];
  });

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('the sprite palette', () => {
  it('is the only file in the entity that writes a colour', () => {
    for (const file of sliceFiles(SLICE)) {
      expect({ file, hex: readFileSync(file, 'utf8').match(HEX) }).toEqual({
        file,
        hex: null,
      });
    }
  });

  it('writes every ink as a six-digit hex', () => {
    for (const color of Object.values(SPRITE_PALETTE)) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('keeps one character per ink and leaves `.` transparent', () => {
    for (const ink of Object.keys(SPRITE_PALETTE)) {
      expect(ink).toHaveLength(1);
    }
    expect(Object.keys(SPRITE_PALETTE)).not.toContain('.');
  });
});
