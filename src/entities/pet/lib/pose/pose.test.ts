import { describe, expect, it } from 'vitest';

import {
  PET_MOOD_NAMES,
  PET_STAGES,
  type PetMood,
  type PetMoodName,
  type PetPose,
} from '../../model';

import {
  lerpPose,
  POSE_BY_MOOD,
  POSE_NEUTRAL,
  poseFor,
  STAGE_POSE,
} from './pose';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A mood of the given name and strength, without going through `moodFor`. */
const mood = (name: PetMoodName, intensity = 1): PetMood => ({
  name,
  reason: 'fed',
  axis: 'both',
  intensity,
});

/** Every stage crossed with every state. */
const everyPose = () =>
  PET_STAGES.flatMap((stage) =>
    PET_MOOD_NAMES.map((name) => ({
      name,
      pose: poseFor(stage, mood(name)),
      stage,
    })),
  );

/** How many fields two poses disagree on. */
const differences = (a: PetPose, b: PetPose) =>
  (Object.keys(a) as (keyof PetPose)[]).filter((key) => a[key] !== b[key])
    .length;

// ═══════════════════════════════════════════
// 1. The tables cover the contract
// ═══════════════════════════════════════════

describe('the pose tables', () => {
  it('has a row for every state and every stage', () => {
    for (const name of PET_MOOD_NAMES) {
      expect(POSE_BY_MOOD[name]).toBeDefined();
    }
    for (const stage of PET_STAGES) {
      expect(STAGE_POSE[stage]).toBeDefined();
    }
  });

  it('produces numbers a renderer can use, for all fifteen', () => {
    for (const { pose } of everyPose()) {
      for (const value of Object.values(pose)) {
        expect(Number.isFinite(value)).toBe(true);
      }

      expect(pose.bodyScale).toBeGreaterThan(0);
      expect(pose.breathPeriodMs).toBeGreaterThan(0);
      expect(Number.isInteger(pose.breathPeriodMs)).toBe(true);
      expect(pose.eyeOpenness).toBeGreaterThanOrEqual(0);
      expect(pose.eyeOpenness).toBeLessThanOrEqual(1);
      expect(pose.bounce).toBeGreaterThanOrEqual(0);
      expect(pose.bounce).toBeLessThanOrEqual(1);
      expect(pose.breathAmplitude).toBeGreaterThanOrEqual(0);
      expect(pose.breathAmplitude).toBeLessThanOrEqual(1);
    }
  });
});

// ═══════════════════════════════════════════
// 2. Growing up is visible — docs/pet.md
// ═══════════════════════════════════════════

describe('the stage shows', () => {
  it('draws the pet bigger at each stage, whatever it feels', () => {
    for (const name of PET_MOOD_NAMES) {
      const [baby, teen, adult] = PET_STAGES.map(
        (stage) => poseFor(stage, mood(name)).bodyScale,
      );

      expect(baby).toBeLessThan(teen);
      expect(teen).toBeLessThan(adult);
    }
  });

  it('keeps the young one the livelier of the two', () => {
    const baby = poseFor('baby', mood('proud'));
    const adult = poseFor('adult', mood('proud'));

    expect(baby.bounce).toBeGreaterThanOrEqual(adult.bounce);
    expect(baby.breathPeriodMs).toBeLessThan(adult.breathPeriodMs);
  });
});

// ═══════════════════════════════════════════
// 3. States are told apart — 2.5.10
// ═══════════════════════════════════════════

describe('the states are distinguishable', () => {
  it('draws pride and sadness as different animals', () => {
    const proud = poseFor('adult', mood('proud'));
    const sad = poseFor('adult', mood('sad'));

    expect(differences(proud, sad)).toBeGreaterThanOrEqual(4);
  });

  it('half-closes the eyes of a bored pet', () => {
    expect(poseFor('adult', mood('bored')).eyeOpenness).toBeLessThan(
      poseFor('adult', mood('proud')).eyeOpenness,
    );
  });

  it('still shows a state that has only just crossed its threshold', () => {
    const barely = poseFor('adult', mood('bored', 0));
    const calm = poseFor('adult', mood('content', 0));

    expect(barely).not.toEqual(calm);
  });

  it('lets a stronger feeling read more strongly, without overshooting', () => {
    const weak = poseFor('adult', mood('sad', 0));
    const strong = poseFor('adult', mood('sad', 1));

    expect(Math.abs(strong.tailAngle)).toBeGreaterThan(
      Math.abs(weak.tailAngle),
    );
    expect(Math.abs(strong.tailAngle)).toBeLessThanOrEqual(
      Math.abs(POSE_BY_MOOD.sad.tailAngle),
    );
  });

  it('leaves a content adult at rest', () => {
    expect(poseFor('adult', mood('content')).bodyTilt).toBe(0);
  });
});

// ═══════════════════════════════════════════
// 4. Blending two poses
// ═══════════════════════════════════════════

describe('lerpPose', () => {
  const from = poseFor('adult', mood('sad'));
  const to = poseFor('adult', mood('proud'));

  it('gives back the ends untouched', () => {
    expect(lerpPose(from, to, 0)).toEqual(from);
    expect(lerpPose(from, to, 1)).toEqual(to);
  });

  it('lands in the middle halfway', () => {
    expect(lerpPose(from, to, 0.5).tailAngle).toBeCloseTo(
      (from.tailAngle + to.tailAngle) / 2,
    );
  });

  it('clamps a fraction that walked off the end', () => {
    expect(lerpPose(from, to, 2)).toEqual(to);
    expect(lerpPose(from, to, -1)).toEqual(from);
  });
});

// ═══════════════════════════════════════════
// 5. The tables survive being read
// ═══════════════════════════════════════════

describe('poseFor is pure', () => {
  it('never writes back into the neutral pose', () => {
    const before = { ...POSE_NEUTRAL };

    for (let i = 0; i < 100; i += 1) {
      poseFor('teen', mood('uncomfortable', i / 100));
    }

    expect(POSE_NEUTRAL).toEqual(before);
  });
});
