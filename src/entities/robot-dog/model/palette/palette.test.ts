import { describe, expect, it } from 'vitest';

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const SLICE = join(__dirname, '..', '..');

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

/** Every source file of the slice except the palette itself. */
const sliceFiles = (folder: string): string[] =>
  readdirSync(folder).flatMap((entry) => {
    const path = join(folder, entry);
    if (statSync(path).isDirectory()) return sliceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('palette.ts') ? [path] : [];
  });

// ═══════════════════════════════════════════
// 1. The palette is the only source of color
// ═══════════════════════════════════════════

describe('the character palette', () => {
  it('is the only file in the slice that writes a colour', () => {
    for (const file of sliceFiles(SLICE)) {
      expect({ file, hex: readFileSync(file, 'utf8').match(HEX) }).toEqual({
        file,
        hex: null,
      });
    }
  });
});
