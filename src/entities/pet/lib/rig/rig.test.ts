import { describe, expect, it } from 'vitest';

import { PET_COLORS, PET_PATTERNS, PET_SPECIES } from '../../model';
import { skinFor } from '../skin';

import { anchorPoint, type RigEllipse, rigFor, VIEW_BOX } from './rig';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Every combination of the three appearance axes. */
const everyRig = () =>
  PET_SPECIES.flatMap((species) =>
    PET_COLORS.flatMap((color) =>
      PET_PATTERNS.map((pattern) => ({
        color,
        pattern,
        rig: rigFor(skinFor(species, color, pattern)),
        species,
      })),
    ),
  );

/** Whether an ellipse sits entirely inside the box. */
const isInBox = (ellipse: RigEllipse) =>
  ellipse.cx - ellipse.rx >= 0 &&
  ellipse.cx + ellipse.rx <= VIEW_BOX &&
  ellipse.cy - ellipse.ry >= 0 &&
  ellipse.cy + ellipse.ry <= VIEW_BOX;

/**
 * Whether the inner ellipse stays inside the outer one.
 *
 * Walks the inner outline rather than its bounding box: a box corner is not a
 * point of the shape, and judging by it rejects drawings that are actually fine.
 */
const isInside = (inner: RigEllipse, outer: RigEllipse, steps = 64) =>
  Array.from(
    { length: steps },
    (_, index) => (index * 2 * Math.PI) / steps,
  ).every((angle) => {
    const dx = (inner.cx + inner.rx * Math.cos(angle) - outer.cx) / outer.rx;
    const dy = (inner.cy + inner.ry * Math.sin(angle) - outer.cy) / outer.ry;

    return dx * dx + dy * dy <= 1;
  });

/** Every number written into a path, so a stray coordinate can be checked. */
const numbersIn = (path: string) =>
  (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

// ═══════════════════════════════════════════
// 1. Three silhouettes, told apart — 2.5.2
// ═══════════════════════════════════════════

describe('the species are different animals', () => {
  it('gives each one its own body width, ears and tail', () => {
    const rigs = PET_SPECIES.map((species) =>
      rigFor(skinFor(species, 'sand', 'solid')),
    );

    expect(new Set(rigs.map((rig) => rig.body.rx)).size).toBe(3);
    expect(new Set(rigs.map((rig) => rig.ears.left)).size).toBe(3);
    expect(new Set(rigs.map((rig) => String(rig.tail))).size).toBe(3);
  });

  it('mirrors the two ears instead of drawing the same one twice', () => {
    for (const { rig } of everyRig()) {
      expect(rig.ears.left).not.toBe(rig.ears.right);
      expect(rig.ears.left.length).toBeGreaterThan(0);
    }
  });

  it('leaves the capybara tailless and gives the other two a tail', () => {
    expect(rigFor(skinFor('capybara', 'mint', 'solid')).tail).toBeNull();
    expect(rigFor(skinFor('cat', 'mint', 'solid')).tail).not.toBeNull();
    expect(rigFor(skinFor('dog', 'mint', 'solid')).tail).not.toBeNull();
  });
});

// ═══════════════════════════════════════════
// 2. Nothing leaves the box
// ═══════════════════════════════════════════

describe('everything fits the viewBox', () => {
  it('keeps body, belly, head and eyes inside 0…100', () => {
    for (const { rig } of everyRig()) {
      for (const part of [
        rig.body,
        rig.belly,
        rig.head,
        rig.eyes.left,
        rig.eyes.right,
        rig.cheeks.left,
        rig.cheeks.right,
      ]) {
        expect(isInBox(part)).toBe(true);
      }
    }
  });

  it('keeps every path coordinate inside the box too', () => {
    for (const { rig } of everyRig()) {
      const paths = [rig.ears.left, rig.ears.right, rig.tail].filter(
        (path): path is string => path !== null,
      );

      for (const path of paths) {
        for (const value of numbersIn(path)) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(VIEW_BOX);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════
// 3. The parts sit on each other correctly
// ═══════════════════════════════════════════

describe('the anatomy holds together', () => {
  it('keeps the belly inside the body', () => {
    for (const { rig } of everyRig()) {
      expect(isInside(rig.belly, rig.body)).toBe(true);
    }
  });

  it('keeps eyes and cheeks inside the head', () => {
    for (const { rig } of everyRig()) {
      for (const part of [
        rig.eyes.left,
        rig.eyes.right,
        rig.cheeks.left,
        rig.cheeks.right,
      ]) {
        expect(isInside(part, rig.head)).toBe(true);
      }
    }
  });

  it('puts the cheeks below the eyes and further out', () => {
    for (const { rig } of everyRig()) {
      expect(rig.cheeks.left.cy).toBeGreaterThan(rig.eyes.left.cy);
      expect(rig.cheeks.left.cx).toBeLessThan(rig.eyes.left.cx);
      expect(rig.cheeks.right.cx).toBeGreaterThan(rig.eyes.right.cx);
    }
  });

  it('puts the head above the body and lets them overlap', () => {
    for (const { rig } of everyRig()) {
      const bodyTop = rig.body.cy - rig.body.ry;

      // Above the shoulders — a head centred inside the body is the bug this
      // catches, and "cy is smaller" alone would not have caught it.
      expect(rig.head.cy + rig.head.ry).toBeLessThan(rig.body.cy);
      expect(rig.head.cy - rig.head.ry).toBeLessThan(bodyTop);

      // Overlapping, not floating: the chin reaches into the body.
      expect(rig.head.cy + rig.head.ry).toBeGreaterThan(bodyTop);
    }
  });
});

// ═══════════════════════════════════════════
// 4. The pattern layer
// ═══════════════════════════════════════════

describe('marks', () => {
  it('draws exactly as many as the skin asks for', () => {
    for (const { rig, pattern, species, color } of everyRig()) {
      expect(rig.marks).toHaveLength(
        skinFor(species, color, pattern).marks.count,
      );
    }
  });

  it('draws none at all for a solid coat', () => {
    for (const species of PET_SPECIES) {
      expect(rigFor(skinFor(species, 'sand', 'solid')).marks).toHaveLength(0);
    }
  });

  it('keeps every mark on the coat, not hanging off the side', () => {
    for (const { rig } of everyRig()) {
      for (const mark of rig.marks) {
        expect(isInside(mark, rig.body)).toBe(true);
      }
    }
  });

  it('places the same marks every time, so a coat never reshuffles', () => {
    expect(rigFor(skinFor('dog', 'mint', 'spots')).marks).toEqual(
      rigFor(skinFor('dog', 'mint', 'spots')).marks,
    );
  });
});

// ═══════════════════════════════════════════
// 5. Pivots and anchors
// ═══════════════════════════════════════════

describe('pivots', () => {
  it('stays in box fractions, the same system as the anchors', () => {
    for (const { rig } of everyRig()) {
      for (const pivot of Object.values(rig.pivots)) {
        expect(pivot.x).toBeGreaterThanOrEqual(0);
        expect(pivot.x).toBeLessThanOrEqual(1);
        expect(pivot.y).toBeGreaterThanOrEqual(0);
        expect(pivot.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('hinges each layer where it should: feet, neck, ear base, eye line', () => {
    for (const { rig } of everyRig()) {
      const { body, head, ear, eye } = rig.pivots;

      expect(body.y).toBeGreaterThan(head.y);
      expect(head.y).toBeGreaterThan(eye.y);
      expect(eye.y).toBeGreaterThan(ear.y);
    }
  });
});

describe('anchorPoint', () => {
  it('turns a fraction into design points', () => {
    expect(anchorPoint({ x: 0.5, y: 1 }, 160)).toEqual({ left: 80, top: 160 });
  });

  it('scales linearly with the size the pet is drawn at', () => {
    const small = anchorPoint({ x: 0.76, y: 0.11 }, 80);
    const large = anchorPoint({ x: 0.76, y: 0.11 }, 160);

    expect(large.left).toBeCloseTo(small.left * 2);
    expect(large.top).toBeCloseTo(small.top * 2);
  });

  it('puts the origin in the corner', () => {
    expect(anchorPoint({ x: 0, y: 0 }, 200)).toEqual({ left: 0, top: 0 });
  });
});

// ═══════════════════════════════════════════
// 6. Pure
// ═══════════════════════════════════════════

describe('rigFor is pure', () => {
  it('gives equal rigs for one skin, in separate objects', () => {
    const skin = skinFor('cat', 'graphite', 'stripes');
    const first = rigFor(skin);
    const second = rigFor(skin);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.body).not.toBe(second.body);
  });
});
