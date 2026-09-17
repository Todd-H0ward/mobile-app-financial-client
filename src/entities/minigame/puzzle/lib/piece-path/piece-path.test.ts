import { describe, expect, it } from 'vitest';

import {
  generateBoard,
  generateLoosePieces,
  hashSeed,
  PIECE_BOX_RATIO,
  piecePath,
  pieceSeamPath,
  shuffleIndices,
} from './piece-path';

// ═══════════════════════════════════════════
// SEED / HASH
// ═══════════════════════════════════════════

describe('hashSeed', () => {
  it('passes numeric ids through as unsigned 32-bit', () => {
    expect(hashSeed(42)).toBe(42);
    expect(hashSeed(-1)).toBe(0xffff_ffff);
  });

  it('is stable for the same string', () => {
    expect(hashSeed('scooter')).toBe(hashSeed('scooter'));
    expect(hashSeed('scooter')).not.toBe(hashSeed('paint'));
  });
});

// ═══════════════════════════════════════════
// PATHS
// ═══════════════════════════════════════════

describe('piecePath', () => {
  it('closes a flat square when every tab is zero', () => {
    const d = piecePath({ top: 0, right: 0, bottom: 0, left: 0 }, 100);
    expect(d.startsWith('M 0 0 ')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).toContain('L 100 0');
    expect(d).toContain('L 100 100');
    expect(d).toContain('L 0 100');
  });

  it('emits curves when a side has a tab', () => {
    const flat = piecePath({ top: 0, right: 0, bottom: 0, left: 0 });
    const tabbed = piecePath({ top: 1, right: 0, bottom: 0, left: 0 });
    expect(tabbed).toContain('C ');
    expect(tabbed.length).toBeGreaterThan(flat.length);
  });
});

describe('pieceSeamPath', () => {
  const tabs = {
    top: 0,
    right: 1,
    bottom: 0,
    left: -1,
  } as const;

  it('returns an empty string when no sides are selected', () => {
    expect(
      pieceSeamPath(tabs, {
        top: false,
        right: false,
        bottom: false,
        left: false,
      }),
    ).toBe('');
  });

  it('starts each selected side with its own move-to', () => {
    const d = pieceSeamPath(tabs, {
      top: true,
      right: true,
      bottom: false,
      left: false,
    });
    expect(d.startsWith('M 0 0 ')).toBe(true);
    expect(d).toContain('M 100 0 ');
  });
});

// ═══════════════════════════════════════════
// BOARD
// ═══════════════════════════════════════════

describe('generateBoard', () => {
  it('keeps outer edges flat', () => {
    const board = generateBoard(6, 3, 7);
    // 2×3 grid: rows 0..1, cols 0..2
    expect(board[0]?.top).toBe(0);
    expect(board[0]?.left).toBe(0);
    expect(board[2]?.right).toBe(0);
    expect(board[3]?.bottom).toBe(0);
    expect(board[5]?.right).toBe(0);
    expect(board[5]?.bottom).toBe(0);
  });

  it('locks neighbours with opposite tabs on the shared edge', () => {
    const board = generateBoard(4, 2, 11);
    // [0][1]
    // [2][3]
    const first = board[0];
    const right = board[1];
    const below = board[2];
    expect(first).toBeDefined();
    expect(right).toBeDefined();
    expect(below).toBeDefined();
    if (!first || !right || !below) return;

    expect(first.right).toBe(-right.left);
    expect(first.bottom).toBe(-below.top);
  });

  it('is deterministic for the same seed', () => {
    expect(generateBoard(9, 3, 5)).toEqual(generateBoard(9, 3, 5));
    expect(generateBoard(9, 3, 5)).not.toEqual(generateBoard(9, 3, 6));
  });
});

describe('generateLoosePieces', () => {
  it('never leaves a flat outer edge — every side has a tab or blank', () => {
    for (const piece of generateLoosePieces(8, 3)) {
      expect(piece.top).not.toBe(0);
      expect(piece.right).not.toBe(0);
      expect(piece.bottom).not.toBe(0);
      expect(piece.left).not.toBe(0);
    }
  });
});

describe('shuffleIndices', () => {
  it('returns a permutation of 0..count-1', () => {
    const shuffled = shuffleIndices(10, 99);
    expect(shuffled).toHaveLength(10);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 10 }, (_, i) => i),
    );
  });

  it('is stable for the same seed and moves pieces for a useful seed', () => {
    expect(shuffleIndices(8, 42)).toEqual(shuffleIndices(8, 42));
    expect(shuffleIndices(8, 42)).not.toEqual(shuffleIndices(8, 43));
    // Not the identity — the old hash-per-step shuffle often was.
    expect(shuffleIndices(8, 42)).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('PIECE_BOX_RATIO', () => {
  it('matches the 32% overhang on each side', () => {
    expect(PIECE_BOX_RATIO).toBeCloseTo(1 + 0.32 * 2);
  });
});
