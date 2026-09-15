import { describe, expect, it } from 'vitest';

import { BUDGET_DIRECTIONS } from '@/entities/economy';

import {
  assertOnboardingContent,
  listDecisions,
  listOnboardingSteps,
  listSortItems,
  MIN_SORT_ITEMS,
  ONBOARDING_STEPS,
} from '../..';

import ONBOARDING_CONTENT from '@/content/onboarding.json';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

/** A seventh card — proves 2.5.14: new content is a JSON row, not a code change. */
const EXTRA_ITEM = {
  id: 'socks',
  title: 'Тёплые носки',
  direction: 'needs',
  explanation: 'В холода носки — это Нужное.',
};

const withItems = (items: unknown[]) => ({ ...ONBOARDING_CONTENT, items });
const withSteps = (steps: unknown[]) => ({ ...ONBOARDING_CONTENT, steps });
const withDecisions = (decisions: unknown[]) => ({
  ...ONBOARDING_CONTENT,
  decisions,
});

// ═══════════════════════════════════════════
// 1. The shipped content is valid
// ═══════════════════════════════════════════

describe('content/onboarding.json', () => {
  it('passes the schema', () => {
    expect(() => assertOnboardingContent(ONBOARDING_CONTENT)).not.toThrow();
  });

  it('describes every step of the walk, and invents none', () => {
    const ids = listOnboardingSteps().map((step) => step.id);

    expect(new Set(ids)).toEqual(new Set(ONBOARDING_STEPS));
  });

  it('explains all three kinds of decision — 2.5.1', () => {
    const ids = listDecisions().map((decision) => decision.id);

    expect(new Set(ids)).toEqual(new Set(BUDGET_DIRECTIONS));
  });

  it('gives every direction something to sort into it', () => {
    for (const direction of BUDGET_DIRECTIONS) {
      expect(listSortItems().some((item) => item.direction === direction)).toBe(
        true,
      );
    }
  });

  it('carries enough cards for the step to read as a rule, not a quiz', () => {
    expect(listSortItems().length).toBeGreaterThanOrEqual(MIN_SORT_ITEMS);
  });

  it('explains every card, so a miss always names the rule', () => {
    for (const item of listSortItems()) {
      expect(item.explanation.length).toBeGreaterThan(0);
    }
  });

  it('accepts a new card added as a plain JSON row', () => {
    expect(() =>
      assertOnboardingContent(
        withItems([...ONBOARDING_CONTENT.items, EXTRA_ITEM]),
      ),
    ).not.toThrow();
  });
});

// ═══════════════════════════════════════════
// 2. Broken content fails here, never on the device
// ═══════════════════════════════════════════

describe('assertOnboardingContent', () => {
  const items = ONBOARDING_CONTENT.items;

  it('rejects a card without an explanation', () => {
    expect(() =>
      assertOnboardingContent(
        withItems([...items, { ...EXTRA_ITEM, explanation: '' }]),
      ),
    ).toThrow(/explanation/);
  });

  it('rejects a card pointing at a direction that does not exist', () => {
    expect(() =>
      assertOnboardingContent(
        withItems([...items, { ...EXTRA_ITEM, direction: 'candy' }]),
      ),
    ).toThrow(/direction/);
  });

  it('rejects a duplicate card id', () => {
    expect(() =>
      assertOnboardingContent(withItems([...items, items[0]])),
    ).toThrow(/duplicate/);
  });

  it('rejects a direction left unsorted', () => {
    // Padded back up to the minimum, so it is the empty basket that fails
    // here and not the card count.
    const withoutSavings = [
      ...items.filter((item) => item.direction !== 'savings'),
      EXTRA_ITEM,
      { ...EXTRA_ITEM, id: 'mittens', title: 'Варежки' },
    ];

    expect(() => assertOnboardingContent(withItems(withoutSavings))).toThrow(
      /savings/,
    );
  });

  it('rejects a missing step and a step nobody walks', () => {
    expect(() =>
      assertOnboardingContent(
        withSteps(ONBOARDING_CONTENT.steps.filter((s) => s.id !== 'name')),
      ),
    ).toThrow(/name/);
    expect(() =>
      assertOnboardingContent(
        withSteps([
          ...ONBOARDING_CONTENT.steps,
          { id: 'quiz', title: 'Тест', line: 'Отвечай' },
        ]),
      ),
    ).toThrow(/quiz/);
  });

  it('rejects a step where the pet says nothing', () => {
    expect(() =>
      assertOnboardingContent(
        withSteps(
          ONBOARDING_CONTENT.steps.map((step) =>
            step.id === 'greeting' ? { ...step, line: '' } : step,
          ),
        ),
      ),
    ).toThrow(/line/);
  });

  it('rejects a fourth kind of decision and a missing third', () => {
    expect(() =>
      assertOnboardingContent(
        withDecisions([
          ...ONBOARDING_CONTENT.decisions,
          {
            id: 'fun',
            title: 'Веселье',
            example: 'Кино',
            hint: 'Четвёртого направления нет',
          },
        ]),
      ),
    ).toThrow(/id/);
    expect(() =>
      assertOnboardingContent(
        withDecisions(ONBOARDING_CONTENT.decisions.slice(0, 2)),
      ),
    ).toThrow(/direction/);
  });

  it('rejects anything that is not an onboarding file', () => {
    expect(() => assertOnboardingContent(null)).toThrow();
    expect(() => assertOnboardingContent({ steps: 'nope' })).toThrow();
    expect(() => assertOnboardingContent(withItems([...items, 7]))).toThrow();
  });
});
