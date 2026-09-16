import { describe, expect, it } from 'vitest';

import {
  PET_COLORS,
  PET_MOOD_NAMES,
  PET_PATTERNS,
  PET_SPECIES,
  PET_STAGES,
  type PetAnchors,
} from '../../model';
import { moodFor } from '../mood';
import { poseFor } from '../pose';
import { skinFor } from '../skin';

import { anchorsFor } from './anchors';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Every species at every stage. */
const everyPet = () =>
  PET_SPECIES.flatMap((species) =>
    PET_STAGES.map((stage) => ({
      anchors: anchorsFor(species, stage),
      species,
      stage,
    })),
  );

const pointsOf = (anchors: PetAnchors) => Object.values(anchors);

// ═══════════════════════════════════════════
// 1. Fractions of the box, always
// ═══════════════════════════════════════════

describe('anchorsFor', () => {
  it('answers for every species at every stage', () => {
    expect(everyPet()).toHaveLength(9);
  });

  it('keeps every point inside the box — the whole scheme rests on it', () => {
    for (const { anchors } of everyPet()) {
      for (const point of pointsOf(anchors)) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('stacks the points head to feet, which is what a renderer assumes', () => {
    for (const { anchors } of everyPet()) {
      expect(anchors.accessory.y).toBeLessThan(anchors.speech.y);
      expect(anchors.speech.y).toBeLessThan(anchors.food.y);
      expect(anchors.food.y).toBeLessThan(anchors.heart.y);
      expect(anchors.heart.y).toBeLessThan(anchors.ground.y);
    }
  });

  it('puts the shadow on the bottom edge, centred, for everyone', () => {
    for (const { anchors } of everyPet()) {
      expect(anchors.ground).toEqual({ x: 0.5, y: 1 });
    }
  });
});

// ═══════════════════════════════════════════
// 2. Growth and species move the points
// ═══════════════════════════════════════════

describe('what the two arguments change', () => {
  it('sits a hat lower on a baby, whose head fills more of the box', () => {
    for (const species of PET_SPECIES) {
      expect(anchorsFor(species, 'baby').accessory.y).toBeGreaterThan(
        anchorsFor(species, 'adult').accessory.y,
      );
    }
  });

  it('carries the capybara head low and forward of the cat one', () => {
    for (const stage of PET_STAGES) {
      const cat = anchorsFor('cat', stage);
      const capybara = anchorsFor('capybara', stage);

      expect(capybara.accessory.y).toBeGreaterThan(cat.accessory.y);
      expect(capybara.speech.x).toBeGreaterThan(cat.speech.x);
    }
  });
});

// ═══════════════════════════════════════════
// 3. Nothing shared between calls
// ═══════════════════════════════════════════

describe('anchorsFor is pure', () => {
  it('does not let a caller mutate the table through what it got', () => {
    const anchors = anchorsFor('dog', 'teen');
    anchors.accessory.y = 99;
    anchors.ground.x = 99;

    expect(anchorsFor('dog', 'teen').accessory.y).not.toBe(99);
    expect(anchorsFor('dog', 'teen').ground.x).toBe(0.5);
  });
});

// ═══════════════════════════════════════════
// 4. The whole contract, end to end
// ═══════════════════════════════════════════

describe('the four pieces together', () => {
  it('hands a renderer only finite numbers, for every pet it can be', () => {
    // 27 looks × 5 states: a NaN sneaked into any table fails here, long
    // before it reaches a screen as an invisible pet.
    for (const species of PET_SPECIES) {
      for (const color of PET_COLORS) {
        for (const pattern of PET_PATTERNS) {
          for (const stage of PET_STAGES) {
            const skin = skinFor(species, color, pattern);
            const anchors = anchorsFor(species, stage);

            expect(Number.isFinite(skin.silhouette.bodyRatio)).toBe(true);
            expect(Number.isFinite(skin.marks.size)).toBe(true);

            for (const point of Object.values(anchors)) {
              expect(Number.isFinite(point.x)).toBe(true);
              expect(Number.isFinite(point.y)).toBe(true);
            }

            for (const value of [0, 0.2, 0.5, 0.8, 1]) {
              const pose = poseFor(stage, moodFor(value, 1 - value));

              expect(Object.values(pose).every(Number.isFinite)).toBe(true);
            }
          }
        }
      }
    }
  });

  it('covers every state the mood tuple declares', () => {
    expect(PET_MOOD_NAMES.length).toBeGreaterThanOrEqual(3);
  });
});
