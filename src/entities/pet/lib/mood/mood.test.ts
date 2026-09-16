import { describe, expect, it } from 'vitest';

import { PET_MOOD_NAMES, PET_REASONS } from '../../model';

import {
  easePetAxes,
  easeTowards,
  moodFor,
  PET_EASE_RATE,
  PET_MOOD_HIGH,
  PET_MOOD_LOW,
} from './mood';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Every axis pair on an 11 × 11 grid, corners included. */
const grid = () => {
  const pairs: [number, number][] = [];

  for (let comfort = 0; comfort <= 10; comfort += 1) {
    for (let spirit = 0; spirit <= 10; spirit += 1) {
      pairs.push([comfort / 10, spirit / 10]);
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

    expect(reached.size).toBe(PET_MOOD_NAMES.length);
  });

  it('expresses «сытый, но скучающий» — the case one number cannot', () => {
    const mood = moodFor(1, 0.1);

    expect(mood.name).toBe('bored');
    expect(mood.axis).toBe('spirit');
  });

  it('points at the axis that decided', () => {
    expect(moodFor(0.1, 1).axis).toBe('comfort');
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
  it('names one for every pair of axes, so the pet is never mute', () => {
    for (const [comfort, spirit] of grid()) {
      expect(PET_REASONS).toContain(moodFor(comfort, spirit).reason);
    }
  });

  it('prefers the cause settlement observed on the deciding axis', () => {
    expect(moodFor(0.1, 1, { comfort: 'cold' }).reason).toBe('cold');
    expect(moodFor(1, 0.1, { spirit: 'goal-far' }).reason).toBe('goal-far');
  });

  it('ignores a hint about the axis that did not decide', () => {
    const mood = moodFor(1, 0.1, { comfort: 'cold' });

    expect(mood.name).toBe('bored');
    expect(mood.reason).not.toBe('cold');
  });

  it('feeds before it cheers up: the body cause wins when both are down', () => {
    const mood = moodFor(0, 0, { comfort: 'hungry', spirit: 'plan-broken' });

    expect(mood.name).toBe('sad');
    expect(mood.reason).toBe('hungry');
  });
});

// ═══════════════════════════════════════════
// 3. How strongly the state reads
// ═══════════════════════════════════════════

describe('intensity', () => {
  it('stays within 0…1 everywhere on the grid', () => {
    for (const [comfort, spirit] of grid()) {
      const { intensity } = moodFor(comfort, spirit);

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
// 4. Inertia is mandatory — docs/pet.md
// ═══════════════════════════════════════════

describe('easeTowards', () => {
  it('never jumps to the target in one step', () => {
    const next = easeTowards(0, 1, PET_EASE_RATE);

    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it('closes the gap monotonically and lands, without overshooting', () => {
    let value = 0;
    let steps = 0;

    while (value !== 1 && steps < 50) {
      const next = easeTowards(value, 1, PET_EASE_RATE);

      expect(next).toBeGreaterThan(value);
      expect(next).toBeLessThanOrEqual(1);

      value = next;
      steps += 1;
    }

    expect(value).toBe(1);
  });

  it('eases downwards the same way', () => {
    const next = easeTowards(1, 0, PET_EASE_RATE);

    expect(next).toBeLessThan(1);
    expect(next).toBeGreaterThan(0);
  });

  it('handles the edges: no rate, full rate, a rate past one', () => {
    expect(easeTowards(0.2, 0.9, 0)).toBe(0.2);
    expect(easeTowards(0.2, 0.9, 1)).toBe(0.9);
    expect(easeTowards(0.2, 0.9, 5)).toBe(0.9);
  });
});

describe('easePetAxes', () => {
  it('eases both axes and keeps them in 0…1', () => {
    const next = easePetAxes(
      { comfort: 0, spirit: 1 },
      { comfort: 1, spirit: 0 },
    );

    expect(next.comfort).toBeGreaterThan(0);
    expect(next.comfort).toBeLessThan(1);
    expect(next.spirit).toBeLessThan(1);
    expect(next.spirit).toBeGreaterThan(0);
  });

  it('returns a fresh object, leaving the current one alone', () => {
    const current = { comfort: 0.5, spirit: 0.5 };
    const next = easePetAxes(current, { comfort: 1, spirit: 1 });

    expect(next).not.toBe(current);
    expect(current).toEqual({ comfort: 0.5, spirit: 0.5 });
  });

  it('travels through the states instead of teleporting to the last one', () => {
    // The body is already the weaker of the two, so it crosses the low
    // threshold first: the pet is uncomfortable before it is sad.
    let axes = { comfort: 0.5, spirit: 1 };
    const seen: string[] = [];

    for (let step = 0; step < 20; step += 1) {
      axes = easePetAxes(axes, { comfort: 0, spirit: 0 });
      seen.push(moodFor(axes.comfort, axes.spirit).name);
    }

    expect(seen.indexOf('uncomfortable')).toBeGreaterThanOrEqual(0);
    expect(seen.indexOf('sad')).toBeGreaterThan(seen.indexOf('uncomfortable'));
  });
});

// ═══════════════════════════════════════════
// 5. The thresholds mean what they say
// ═══════════════════════════════════════════

describe('thresholds', () => {
  it('treats the low threshold itself as not a problem yet', () => {
    expect(moodFor(PET_MOOD_LOW, 1).name).not.toBe('uncomfortable');
    expect(moodFor(PET_MOOD_LOW - 0.01, 1).name).toBe('uncomfortable');
  });

  it('calls the pet proud only once both axes clear the high threshold', () => {
    expect(moodFor(PET_MOOD_HIGH, PET_MOOD_HIGH).name).toBe('proud');
    expect(moodFor(PET_MOOD_HIGH - 0.01, 1).name).toBe('content');
  });
});
