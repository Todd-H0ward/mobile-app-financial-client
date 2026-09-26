import { ShapeGeometry, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import {
  layoutTextShapes,
  textGeometryLocal,
  textGeometryOnPlane,
} from './scene-glyphs';

describe('layoutTextShapes', () => {
  it('emits font outlines for digits', () => {
    expect(layoutTextShapes('1', 8).length).toBeGreaterThanOrEqual(1);
    // Two-digit strings carry more contour pieces (stems + counters).
    expect(layoutTextShapes('10', 8).length).toBeGreaterThan(
      layoutTextShapes('1', 8).length,
    );
  });

  it('keeps counters as holes on closed digits', () => {
    const eight = layoutTextShapes('8', 8);
    const hasHole = eight.some((shape) => shape.holes.length > 0);
    expect(hasHole).toBe(true);
  });
});

describe('textGeometryOnPlane', () => {
  it('lays the glyph flat on the given Y', () => {
    const anchor = new Vector3(100, 40, 0);
    const tangent = new Vector3(0, 0, 1);
    const up = new Vector3(1, 0, 0);
    const geometry = textGeometryOnPlane('12', anchor, tangent, up, 22);
    const position = geometry.getAttribute('position');
    expect(position.count).toBeGreaterThan(0);
    for (let i = 0; i < position.count; i += 1) {
      expect(position.getY(i)).toBeCloseTo(anchor.y, 5);
    }
    geometry.dispose();
  });
});

describe('textGeometryLocal', () => {
  it('writes every vertex at the ink Z', () => {
    const geometry = textGeometryLocal('8', 0, 0, 28, 7.4);
    const position = geometry.getAttribute('position');
    expect(position.count).toBeGreaterThan(0);
    for (let i = 0; i < position.count; i += 1) {
      expect(position.getZ(i)).toBeCloseTo(7.4, 5);
    }
    expect(geometry).toBeInstanceOf(ShapeGeometry);
    geometry.dispose();
  });
});
