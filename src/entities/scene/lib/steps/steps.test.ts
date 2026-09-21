import { describe, expect, it } from 'vitest';

import { SCENE_STEP_COUNT, SCENE_STEP_RISE } from '../../model';

import { liftFor, stepOffset } from './steps';

// ═══════════════════════════════════════════
// 1. Where a tier sits
// ═══════════════════════════════════════════

describe('stepOffset', () => {
  it('leaves a fully raised tier exactly where the model has it', () => {
    for (let step = 0; step < SCENE_STEP_COUNT; step += 1) {
      // A zero drop may carry a sign; the position is what matters.
      expect(stepOffset(step, 1, SCENE_STEP_RISE)).toBeCloseTo(0, 10);
    }
  });

  it('drops a lowered tier flush with the bottom one', () => {
    for (let step = 0; step < SCENE_STEP_COUNT; step += 1) {
      expect(stepOffset(step, 0, SCENE_STEP_RISE)).toBeCloseTo(
        -step * SCENE_STEP_RISE,
        10,
      );
    }
  });

  it('never moves the bottom tier, whatever the lift', () => {
    for (const lift of [0, 0.3, 0.5, 1]) {
      expect(stepOffset(0, lift, SCENE_STEP_RISE)).toBeCloseTo(0, 10);
    }
  });

  it('climbs without ever overshooting its place', () => {
    let previous = stepOffset(4, 0, SCENE_STEP_RISE);

    for (let i = 1; i <= 10; i += 1) {
      const offset = stepOffset(4, i / 10, SCENE_STEP_RISE);
      expect(offset).toBeGreaterThanOrEqual(previous);
      expect(offset).toBeLessThanOrEqual(0);
      previous = offset;
    }

    expect(previous).toBeCloseTo(0, 10);
  });

  it('treats a lift outside 0…1 as the nearest end', () => {
    expect(stepOffset(3, -5, SCENE_STEP_RISE)).toBe(
      stepOffset(3, 0, SCENE_STEP_RISE),
    );
    expect(stepOffset(3, 5, SCENE_STEP_RISE)).toBe(
      stepOffset(3, 1, SCENE_STEP_RISE),
    );
  });
});

// ═══════════════════════════════════════════
// 2. Counting raised tiers
// ═══════════════════════════════════════════

describe('liftFor', () => {
  it('raises exactly as many tiers as it is asked for, bottom first', () => {
    for (let raised = 0; raised <= SCENE_STEP_COUNT; raised += 1) {
      const lifted = Array.from({ length: SCENE_STEP_COUNT }, (_, step) =>
        liftFor(step, raised),
      );

      expect(lifted.filter((lift) => lift === 1)).toHaveLength(raised);
      // Raised tiers come first: no gap in the staircase.
      expect(lifted).toEqual([...lifted].sort((a, b) => b - a));
    }
  });

  it('leaves the room flat when nothing is raised', () => {
    expect(liftFor(0, 0)).toBe(0);
    expect(liftFor(SCENE_STEP_COUNT - 1, 0)).toBe(0);
  });
});
