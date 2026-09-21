import { describe, expect, it } from 'vitest';

import { SCENE_SOURCE } from '../../model';

import {
  alignAngle,
  angleDistance,
  damp,
  fitDistance,
  nearestSegment,
  normalizeAngle,
  orbitPosition,
} from './orbit';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const ANGLES = SCENE_SOURCE.segmentAngles;

// ═══════════════════════════════════════════
// 1. Angles fold, and take the short road
// ═══════════════════════════════════════════

describe('normalizeAngle', () => {
  it('folds any heading into a single turn', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-10)).toBe(350);
    expect(normalizeAngle(-730)).toBe(350);
  });
});

describe('alignAngle', () => {
  it('crosses zero the short way instead of unwinding', () => {
    expect(alignAngle(350, 10)).toBe(370);
    expect(alignAngle(10, 350)).toBe(-10);
  });

  it('keeps the camera where it is when it is already there', () => {
    expect(alignAngle(98.5, 98.5)).toBe(98.5);
    expect(alignAngle(458.5, 98.5)).toBe(458.5);
  });

  it('never asks for more than half a turn', () => {
    for (let current = -720; current <= 720; current += 7) {
      for (const target of ANGLES) {
        expect(
          Math.abs(alignAngle(current, target) - current),
        ).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe('angleDistance', () => {
  it('measures the short way round', () => {
    expect(angleDistance(350, 10)).toBe(20);
    expect(angleDistance(10, 350)).toBe(20);
    expect(angleDistance(0, 180)).toBe(180);
  });
});

// ═══════════════════════════════════════════
// 2. Parking in front of a room
// ═══════════════════════════════════════════

describe('nearestSegment', () => {
  it('lands on the room it is pointed at', () => {
    ANGLES.forEach((angle, index) => {
      expect(nearestSegment(angle, ANGLES)).toBe(index);
      expect(nearestSegment(angle + 359.9, ANGLES)).toBe(index);
    });
  });

  it('stays inside the wedge it started in', () => {
    ANGLES.forEach((angle, index) => {
      // Rooms are 120° apart, so anything within 59° is still this room.
      expect(nearestSegment(angle + 59, ANGLES)).toBe(index);
      expect(nearestSegment(angle - 59, ANGLES)).toBe(index);
    });
  });

  it('answers with a real room for every heading of the circle', () => {
    for (let azimuth = -360; azimuth <= 720; azimuth += 3) {
      const segment = nearestSegment(azimuth, ANGLES);
      expect(segment).toBeGreaterThanOrEqual(0);
      expect(segment).toBeLessThan(ANGLES.length);
    }
  });
});

// ═══════════════════════════════════════════
// 3. Where the camera ends up
// ═══════════════════════════════════════════

describe('orbitPosition', () => {
  it('keeps the requested distance from the axis', () => {
    for (const elevation of [0, 35.5, 82]) {
      const { x, y, z } = orbitPosition(120, elevation, 1000);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1000, 6);
    }
  });

  it('stands on the same side as the room it looks at', () => {
    ANGLES.forEach((angle) => {
      const { x, z } = orbitPosition(angle, 35, 1000);
      const heading = ((Math.atan2(x, z) * 180) / Math.PI + 360) % 360;
      expect(heading).toBeCloseTo(angle, 6);
    });
  });

  it('climbs straight up as the elevation approaches the pole', () => {
    const { x, y, z } = orbitPosition(45, 90, 500);
    expect(y).toBeCloseTo(500, 6);
    expect(Math.hypot(x, z)).toBeCloseTo(0, 6);
  });
});

// ═══════════════════════════════════════════
// 4. Framing the model on a screen of any shape
// ═══════════════════════════════════════════

describe('fitDistance', () => {
  const RADIUS = 563;
  const FOV = 45;

  it('stands back far enough that the sphere fits across the width', () => {
    for (const aspect of [9 / 16, 3 / 4, 1, 4 / 3]) {
      const distance = fitDistance(RADIUS, FOV, aspect);
      const vertical = ((FOV / 2) * Math.PI) / 180;
      const horizontal = Math.atan(Math.tan(vertical) * aspect);

      expect(distance * Math.sin(horizontal)).toBeGreaterThanOrEqual(
        RADIUS - 1e-6,
      );
      expect(distance * Math.sin(vertical)).toBeGreaterThanOrEqual(
        RADIUS - 1e-6,
      );
    }
  });

  it('pulls further back the narrower the screen gets', () => {
    expect(fitDistance(RADIUS, FOV, 9 / 16)).toBeGreaterThan(
      fitDistance(RADIUS, FOV, 3 / 4),
    );
    expect(fitDistance(RADIUS, FOV, 3 / 4)).toBeGreaterThan(
      fitDistance(RADIUS, FOV, 1),
    );
  });

  it('never moves closer than the tightest side allows, whatever the margin', () => {
    expect(fitDistance(RADIUS, FOV, 9 / 16, 0.94)).toBeLessThan(
      fitDistance(RADIUS, FOV, 9 / 16),
    );
  });
});

// ═══════════════════════════════════════════
// 5. Easing that does not depend on the frame rate
// ═══════════════════════════════════════════

describe('damp', () => {
  it('goes nowhere when no time has passed', () => {
    expect(damp(0, 100, 0.001, 0)).toBe(0);
  });

  it('covers the same ground in one step as in many', () => {
    const steps = (count: number) => {
      let value = 0;
      for (let i = 0; i < count; i += 1)
        value = damp(value, 100, 0.001, 1 / count);
      return value;
    };

    expect(steps(60)).toBeCloseTo(steps(1), 6);
    expect(steps(120)).toBeCloseTo(steps(1), 6);
  });

  it('closes in on the target without overshooting it', () => {
    let value = 0;
    for (let i = 0; i < 300; i += 1) value = damp(value, 100, 0.001, 1 / 60);
    expect(value).toBeGreaterThan(99.9);
    expect(value).toBeLessThanOrEqual(100);
  });
});
