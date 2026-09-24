import { describe, expect, it } from 'vitest';

import { ROBOT_DOG_MOOD_NAMES, ROBOT_DOG_REASONS } from '../../model';

import {
  easeRobotDogAxes,
  easeTowards,
  moodFor,
  ROBOT_DOG_EASE_RATE,
  ROBOT_DOG_MOOD_HIGH,
  ROBOT_DOG_MOOD_LOW,
} from './mood';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Every axis pair on an 11 × 11 grid, corners included. */
const grid = () => {
  const pairs: [number, number][] = [];

  for (let charge = 0; charge <= 10; charge += 1) {
    for (let spirit = 0; spirit <= 10; spirit += 1) {
      pairs.push([charge / 10, spirit / 10]);
    }
  }

  return pairs;
};

// ═══════════════════════════════════════════
// 1. At least three states — 2.5.10
// ═══════════════════════════════════════════

describe('moodFor names the state', () => {
  it('reaches every one of the five', () => {
    const reached = new Set([
      moodFor(1, 1).name,
      moodFor(0.5, 0.5).name,
      moodFor(1, 0.1).name,
      moodFor(0.1, 1).name,
      moodFor(0, 0).name,
    ]);

    expect(reached.size).toBe(ROBOT_DOG_MOOD_NAMES.length);
  });

  it('expresses «сытый, но скучающий» — the case one number cannot', () => {
    const mood = moodFor(1, 0.1);

    expect(mood.name).toBe('bored');
    expect(mood.axis).toBe('spirit');
  });

  it('points at the axis that decided', () => {
    expect(moodFor(0.1, 1).axis).toBe('charge');
    expect(moodFor(0, 0).axis).toBe('both');
  });

  it('clamps an axis that arrives out of range', () => {
    expect(moodFor(2, -1)).toEqual(moodFor(1, 0));
  });

  it('gives the same answer to the same numbers', () => {
    expect(moodFor(0.42, 0.61)).toEqual(moodFor(0.42, 0.61));
  });
});

// ═══════════════════════════════════════════
// 2. Every state carries a cause — 2.5.10
// ═══════════════════════════════════════════

describe('the cause is never missing', () => {
  it('names one for every pair of axes, so the dog is never mute', () => {
    for (const [charge, spirit] of grid()) {
      expect(ROBOT_DOG_REASONS).toContain(moodFor(charge, spirit).reason);
    }
  });

  it('prefers the cause settlement observed on the deciding axis', () => {
    expect(moodFor(0.1, 1, { charge: 'drained' }).reason).toBe('drained');
    expect(moodFor(1, 0.1, { spirit: 'goal-far' }).reason).toBe('goal-far');
  });

  it('ignores a hint about the axis that did not decide', () => {
    const mood = moodFor(1, 0.1, { charge: 'drained' });

    expect(mood.name).toBe('bored');
    expect(mood.reason).not.toBe('drained');
  });

  it('charges before it cheers up: the charge cause wins when both are down', () => {
    const mood = moodFor(0, 0, { charge: 'drained', spirit: 'plan-broken' });

    expect(mood.name).toBe('sad');
    expect(mood.reason).toBe('drained');
  });
});

// ═══════════════════════════════════════════
// 3. How strongly the state reads
// ═══════════════════════════════════════════

describe('intensity', () => {
  it('stays within 0…1 everywhere on the grid', () => {
    for (const [charge, spirit] of grid()) {
      const { intensity } = moodFor(charge, spirit);

      expect(intensity).toBeGreaterThanOrEqual(0);
      expect(intensity).toBeLessThanOrEqual(1);
    }
  });

  it('grows as the axis falls further', () => {
    expect(moodFor(0, 1).intensity).toBeGreaterThan(moodFor(0.3, 1).intensity);
  });

  it('is exactly zero in the middle, where nothing is wrong or remarkable', () => {
    expect(moodFor(0.5, 0.5)).toMatchObject({ intensity: 0, name: 'content' });
  });
});

// ═══════════════════════════════════════════
// 4. Inertia is mandatory — docs/robot-dog.md
// ═══════════════════════════════════════════

describe('easeTowards', () => {
  it('never jumps to the target in one step', () => {
    const next = easeTowards(0, 1, ROBOT_DOG_EASE_RATE);

    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it('closes the gap monotonically and lands, without overshooting', () => {
    let value = 0;
    let steps = 0;

    while (value !== 1 && steps < 50) {
      const next = easeTowards(value, 1, ROBOT_DOG_EASE_RATE);

      expect(next).toBeGreaterThan(value);
      expect(next).toBeLessThanOrEqual(1);

      value = next;
      steps += 1;
    }

    expect(value).toBe(1);
  });

  it('eases downwards the same way', () => {
    const next = easeTowards(1, 0, ROBOT_DOG_EASE_RATE);

    expect(next).toBeLessThan(1);
    expect(next).toBeGreaterThan(0);
  });

  it('handles the edges: no rate, full rate, a rate past one', () => {
    expect(easeTowards(0.2, 0.9, 0)).toBe(0.2);
    expect(easeTowards(0.2, 0.9, 1)).toBe(0.9);
    expect(easeTowards(0.2, 0.9, 5)).toBe(0.9);
  });
});

describe('easeRobotDogAxes', () => {
  it('eases both axes and keeps them in 0…1', () => {
    const next = easeRobotDogAxes(
      { charge: 0, spirit: 1 },
      { charge: 1, spirit: 0 },
    );

    expect(next.charge).toBeGreaterThan(0);
    expect(next.charge).toBeLessThan(1);
    expect(next.spirit).toBeLessThan(1);
    expect(next.spirit).toBeGreaterThan(0);
  });

  it('returns a fresh object, leaving the current one alone', () => {
    const current = { charge: 0.5, spirit: 0.5 };
    const next = easeRobotDogAxes(current, { charge: 1, spirit: 1 });

    expect(next).not.toBe(current);
    expect(current).toEqual({ charge: 0.5, spirit: 0.5 });
  });

  it('travels through the states instead of teleporting to the last one', () => {
    // The body is already the weaker of the two, so it crosses the low
    // threshold first: the dog is tired before it is sad.
    let axes = { charge: 0.5, spirit: 1 };
    const seen: string[] = [];

    for (let step = 0; step < 20; step += 1) {
      axes = easeRobotDogAxes(axes, { charge: 0, spirit: 0 });
      seen.push(moodFor(axes.charge, axes.spirit).name);
    }

    expect(seen.indexOf('tired')).toBeGreaterThanOrEqual(0);
    expect(seen.indexOf('sad')).toBeGreaterThan(seen.indexOf('tired'));
  });
});

// ═══════════════════════════════════════════
// 5. The thresholds mean what they say
// ═══════════════════════════════════════════

describe('thresholds', () => {
  it('treats the low threshold itself as not a problem yet', () => {
    expect(moodFor(ROBOT_DOG_MOOD_LOW, 1).name).not.toBe('tired');
    expect(moodFor(ROBOT_DOG_MOOD_LOW - 0.01, 1).name).toBe('tired');
  });

  it('calls the dog proud only once both axes clear the high threshold', () => {
    expect(moodFor(ROBOT_DOG_MOOD_HIGH, ROBOT_DOG_MOOD_HIGH).name).toBe(
      'proud',
    );
    expect(moodFor(ROBOT_DOG_MOOD_HIGH - 0.01, 1).name).toBe('content');
  });
});
