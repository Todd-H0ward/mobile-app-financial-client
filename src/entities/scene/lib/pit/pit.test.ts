import { describe, expect, it } from 'vitest';

import {
  SCENE_LEVEL_COUNT,
  SCENE_TERRACE_COUNT,
  SCENE_TERRACE_RISE,
} from '../../model/pit';

import { gearAngle, levelProgress, terraceSinkY, terracesInView } from './pit';

// ═══════════════════════════════════════════
// 1. Levels map onto terraces
// ═══════════════════════════════════════════

describe('levelProgress', () => {
  it('starts on the lowest terrace and ends on the flat', () => {
    expect(levelProgress(0)).toBe(0);
    expect(levelProgress(SCENE_LEVEL_COUNT)).toBe(1);
  });

  it('climbs by the same share on every level', () => {
    const steps = Array.from(
      { length: SCENE_LEVEL_COUNT },
      (_, index) => levelProgress(index + 1) - levelProgress(index),
    );

    for (const step of steps) expect(step).toBeCloseTo(steps[0], 10);
  });

  it('holds at the top rather than climbing past it', () => {
    expect(levelProgress(SCENE_LEVEL_COUNT + 3)).toBe(1);
  });

  it('never drops below the bottom, whatever it is handed', () => {
    expect(levelProgress(-4)).toBe(0);
  });
});

// ═══════════════════════════════════════════
// 2. The bowl sinks across all five stages
// ═══════════════════════════════════════════

/** Where a ring's top surface ends up, in world units. */
const topOf = (terrace: number, progress: number) =>
  terrace * SCENE_TERRACE_RISE + terraceSinkY(terrace, progress);

describe('terraceSinkY', () => {
  it('leaves the bowl as the artist built it before the first level', () => {
    for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
      // A zero drop may carry a sign; the depth is what matters.
      expect(terraceSinkY(terrace, 0)).toBeCloseTo(0, 10);
    }
  });

  it('only ever sinks a ring, never raises it', () => {
    for (let i = 0; i <= 20; i += 1) {
      for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
        expect(terraceSinkY(terrace, i / 20)).toBeLessThanOrEqual(0);
      }
    }
  });

  it('flattens the whole bowl into one plane by the last level', () => {
    for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
      expect(topOf(terrace, 1)).toBeCloseTo(0, 6);
    }
  });

  it('never drops a ring below the floor the robot stands on', () => {
    for (let i = 0; i <= 20; i += 1) {
      for (let terrace = 0; terrace < SCENE_TERRACE_COUNT; terrace += 1) {
        expect(topOf(terrace, i / 20)).toBeGreaterThanOrEqual(-1e-6);
      }
    }
  });

  it('swallows the rings from the inside out', () => {
    const progress = levelProgress(2);

    // The ring nearest the robot settles before the one behind it.
    expect(topOf(1, progress)).toBeLessThan(topOf(3, progress));
  });
});

describe('terracesInView', () => {
  it('shows the whole bowl at the bottom and a plain at the top', () => {
    expect(terracesInView(0)).toBe(SCENE_TERRACE_COUNT);
    expect(terracesInView(1)).toBe(1);
  });

  it('keeps a visible height change through all five required stages', () => {
    expect(SCENE_LEVEL_COUNT).toBe(5);
    let previous = topOf(SCENE_TERRACE_COUNT - 1, 0);
    for (let level = 1; level <= 5; level += 1) {
      const now = topOf(SCENE_TERRACE_COUNT - 1, levelProgress(level));
      expect(now).toBeLessThan(previous);
      if (level < 5) expect(now).toBeGreaterThan(0);
      else expect(now).toBe(0);
      previous = now;
    }
  });
});

// ═══════════════════════════════════════════
// 4. The gear train
// ═══════════════════════════════════════════

describe('gearAngle', () => {
  it('leaves every gear still before the climb starts', () => {
    for (let gear = 0; gear < 3; gear += 1) {
      expect(gearAngle(gear, 0)).toBeCloseTo(0, 10);
    }
  });

  it('turns neighbouring gears opposite ways', () => {
    expect(Math.sign(gearAngle(0, 1))).toBe(-Math.sign(gearAngle(1, 1)));
    expect(Math.sign(gearAngle(1, 1))).toBe(-Math.sign(gearAngle(2, 1)));
  });

  it('keeps turning as the floor climbs', () => {
    let previous = Math.abs(gearAngle(0, 0));

    for (let i = 1; i <= 10; i += 1) {
      const next = Math.abs(gearAngle(0, i / 10));
      expect(next).toBeGreaterThan(previous);
      previous = next;
    }
  });
});
