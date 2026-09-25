import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import {
  cellNumberLines,
  DIGIT_HEIGHT,
  numberLineFloats,
} from './cell-number-marker';

describe('cellNumberLines', () => {
  it('emits a stable float count for a given ordinal', () => {
    const anchor = new Vector3(100, 40, 0);
    const lines = cellNumberLines(0, anchor);
    expect(lines.length).toBe(numberLineFloats(0));
    expect(lines.length % 6).toBe(0);
  });

  it('grows with more digits', () => {
    // ordinal+1: 0→"1", 8→"9" (one digit); 9→"10" (two digits).
    expect(numberLineFloats(8)).toBe(numberLineFloats(0));
    expect(numberLineFloats(9)).toBeGreaterThan(numberLineFloats(8));
  });

  it('lays the glyph flat on the cell top', () => {
    const anchor = new Vector3(100, 40, 0);
    const lines = cellNumberLines(0, anchor, DIGIT_HEIGHT);
    for (let i = 1; i < lines.length; i += 3) {
      expect(lines[i]).toBeCloseTo(anchor.y, 5);
    }
  });
});
