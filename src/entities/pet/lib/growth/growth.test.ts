import { describe, expect, it } from 'vitest';

import type { PET_STAGES } from '../../model';

import {
  GROWTH_RULES,
  type GrowthFacts,
  growPet,
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
const exactly = (stage: (typeof PET_STAGES)[number]) => ({
  ...GROWTH_RULES[stage],
});

// ═══════════════════════════════════════════
// 1. The formula — docs/pet.md
// ═══════════════════════════════════════════

describe('stageFor', () => {
  it('starts every pet as a baby', () => {
    expect(stageFor(facts(0, 0, 0))).toBe('baby');
  });

  it('gives each stage away at exactly its own numbers', () => {
    expect(stageFor(exactly('teen'))).toBe('teen');
    expect(stageFor(exactly('adult'))).toBe('adult');
  });

  it('asks for every condition, not the easiest one', () => {
    // Периодов достаточно на взрослого, но целей и планов — нет.
    expect(stageFor(facts(10, 0, 0))).toBe('baby');
    expect(stageFor(facts(10, 1, 1))).toBe('teen');
  });

  it('holds a pet back when one condition is one short', () => {
    expect(stageFor(facts(4, 2, 2))).toBe('teen');
    expect(stageFor(facts(4, 1, 3))).toBe('teen');
    expect(stageFor(facts(3, 2, 3))).toBe('teen');
  });

  it('does not grow on waiting alone — no counter is a clock', () => {
    expect(stageFor(facts(100, 0, 0))).toBe('baby');
  });
});

// ═══════════════════════════════════════════
// 2. Progress never goes backwards — 2.2
// ═══════════════════════════════════════════

describe('growPet', () => {
  it('raises the stage once it is earned', () => {
    expect(growPet('baby', exactly('teen'))).toBe('teen');
    expect(growPet('teen', exactly('adult'))).toBe('adult');
  });

  it('never lowers a stage, whatever the facts say', () => {
    expect(growPet('adult', facts(0, 0, 0))).toBe('adult');
    expect(growPet('teen', facts(0, 0, 0))).toBe('teen');
  });

  it('skips a stage when the facts jumped past it', () => {
    expect(growPet('baby', exactly('adult'))).toBe('adult');
  });

  it('is stable: settling twice changes nothing', () => {
    const once = growPet('baby', exactly('teen'));

    expect(growPet(once, exactly('teen'))).toBe(once);
  });
});

// ═══════════════════════════════════════════
// 3. The reason is always nameable
// ═══════════════════════════════════════════

describe('progressToNextStage', () => {
  it('names what is missing in whole numbers', () => {
    expect(progressToNextStage('baby', facts(1, 0, 0))).toEqual({
      next: 'teen',
      periods: 1,
      goalsReached: 1,
      plansKept: 1,
    });
  });

  it('counts a met condition as zero, never as a negative', () => {
    expect(progressToNextStage('baby', facts(9, 9, 9))).toEqual({
      next: 'teen',
      periods: 0,
      goalsReached: 0,
      plansKept: 0,
    });
  });

  it('says nothing is left at the last stage', () => {
    expect(progressToNextStage('adult', facts(0, 0, 0))).toBeNull();
  });

  it('agrees with stageFor: all zeros left means the stage is earned', () => {
    const grid: GrowthFacts[] = [];
    for (let p = 0; p <= 5; p += 1) {
      for (let g = 0; g <= 3; g += 1) {
        for (let k = 0; k <= 4; k += 1) grid.push(facts(p, g, k));
      }
    }

    for (const current of grid) {
      const left = progressToNextStage('baby', current);
      const isClear =
        left !== null &&
        left.periods === 0 &&
        left.goalsReached === 0 &&
        left.plansKept === 0;

      expect(isClear).toBe(stageFor(current) !== 'baby');
    }
  });
});
