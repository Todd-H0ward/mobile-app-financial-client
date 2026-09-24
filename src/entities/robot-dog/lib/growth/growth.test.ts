import { describe, expect, it } from 'vitest';

import type { ROBOT_DOG_STAGES } from '../../model';

import {
  GROWTH_RULES,
  type GrowthFacts,
  growRobotDog,
  progressToNextStage,
  stageFor,
} from './growth';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const facts = (
  periods: number,
  goalsReached: number,
  plansKept: number,
): GrowthFacts => ({ periods, goalsReached, plansKept });

/** Exactly what a stage asks for, and not one decision more. */
const exactly = (stage: (typeof ROBOT_DOG_STAGES)[number]) => ({
  ...GROWTH_RULES[stage],
});

// ═══════════════════════════════════════════
// 1. The formula — docs/robot-dog.md
// ═══════════════════════════════════════════

describe('stageFor', () => {
  it('starts every dog at the basic stage', () => {
    expect(stageFor(facts(0, 0, 0))).toBe('basic');
  });

  it('gives each stage away at exactly its own numbers', () => {
    expect(stageFor(exactly('upgraded'))).toBe('upgraded');
    expect(stageFor(exactly('complete'))).toBe('complete');
  });

  it('asks for every condition, not the easiest one', () => {
    // Периодов достаточно на взрослого, но целей и планов — нет.
    expect(stageFor(facts(10, 0, 0))).toBe('basic');
    expect(stageFor(facts(10, 1, 1))).toBe('upgraded');
  });

  it('holds a dog back when one condition is one short', () => {
    expect(stageFor(facts(4, 2, 2))).toBe('upgraded');
    expect(stageFor(facts(4, 1, 3))).toBe('upgraded');
    expect(stageFor(facts(3, 2, 3))).toBe('upgraded');
  });

  it('does not grow on waiting alone — no counter is a clock', () => {
    expect(stageFor(facts(100, 0, 0))).toBe('basic');
  });
});

// ═══════════════════════════════════════════
// 2. Progress never goes backwards — 2.2
// ═══════════════════════════════════════════

describe('growRobotDog', () => {
  it('raises the stage once it is earned', () => {
    expect(growRobotDog('basic', exactly('upgraded'))).toBe('upgraded');
    expect(growRobotDog('upgraded', exactly('complete'))).toBe('complete');
  });

  it('never lowers a stage, whatever the facts say', () => {
    expect(growRobotDog('complete', facts(0, 0, 0))).toBe('complete');
    expect(growRobotDog('upgraded', facts(0, 0, 0))).toBe('upgraded');
  });

  it('skips a stage when the facts jumped past it', () => {
    expect(growRobotDog('basic', exactly('complete'))).toBe('complete');
  });

  it('is stable: settling twice changes nothing', () => {
    const once = growRobotDog('basic', exactly('upgraded'));

    expect(growRobotDog(once, exactly('upgraded'))).toBe(once);
  });
});

// ═══════════════════════════════════════════
// 3. The reason is always nameable
// ═══════════════════════════════════════════

describe('progressToNextStage', () => {
  it('names what is missing in whole numbers', () => {
    expect(progressToNextStage('basic', facts(1, 0, 0))).toEqual({
      next: 'upgraded',
      periods: 1,
      goalsReached: 1,
      plansKept: 1,
    });
  });

  it('counts a met condition as zero, never as a negative', () => {
    expect(progressToNextStage('basic', facts(9, 9, 9))).toEqual({
      next: 'upgraded',
      periods: 0,
      goalsReached: 0,
      plansKept: 0,
    });
  });

  it('says nothing is left at the last stage', () => {
    expect(progressToNextStage('complete', facts(0, 0, 0))).toBeNull();
  });

  it('agrees with stageFor: all zeros left means the stage is earned', () => {
    const grid: GrowthFacts[] = [];
    for (let p = 0; p <= 5; p += 1) {
      for (let g = 0; g <= 3; g += 1) {
        for (let k = 0; k <= 4; k += 1) grid.push(facts(p, g, k));
      }
    }

    for (const current of grid) {
      const left = progressToNextStage('basic', current);
      const isClear =
        left !== null &&
        left.periods === 0 &&
        left.goalsReached === 0 &&
        left.plansKept === 0;

      expect(isClear).toBe(stageFor(current) !== 'basic');
    }
  });
});
