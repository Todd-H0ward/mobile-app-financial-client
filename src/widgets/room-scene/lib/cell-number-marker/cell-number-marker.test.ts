import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { cellNumberGeometry, DIGIT_HEIGHT } from './cell-number-marker';

describe('cellNumberGeometry', () => {
  it('emits a non-empty mesh for a single-digit lesson', () => {
    const geometry = cellNumberGeometry(0, new Vector3(100, 40, 0));
    const position = geometry.getAttribute('position');
    expect(position.count).toBeGreaterThan(0);
    geometry.dispose();
  });

  it('grows wider with more digits', () => {
    // ordinal+1: 8→"9" (one digit); 9→"10" (two digits).
    const one = cellNumberGeometry(8, new Vector3(100, 40, 0));
    const two = cellNumberGeometry(9, new Vector3(100, 40, 0));
    one.computeBoundingBox();
    two.computeBoundingBox();
    const oneSpan =
      (one.boundingBox?.max.z ?? 0) - (one.boundingBox?.min.z ?? 0);
    const twoSpan =
      (two.boundingBox?.max.z ?? 0) - (two.boundingBox?.min.z ?? 0);
    // Anchor at (100,40,0) puts reading direction along ±Z.
    expect(twoSpan).toBeGreaterThan(oneSpan);
    one.dispose();
    two.dispose();
  });

  it('lays the glyph flat on the cell top', () => {
    const anchor = new Vector3(100, 40, 0);
    const geometry = cellNumberGeometry(0, anchor, DIGIT_HEIGHT);
    const position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      expect(position.getY(i)).toBeCloseTo(anchor.y, 5);
    }
    geometry.dispose();
  });
});
