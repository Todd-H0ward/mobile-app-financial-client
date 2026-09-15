import { BUDGET_DIRECTIONS, type BudgetDirection } from '@/entities/economy';

import { isRecord } from '@/shared/utils';

import {
  type DecisionContent,
  ONBOARDING_STEPS,
  type OnboardingFile,
  type OnboardingStepContent,
  type OnboardingStepId,
  type SortItemContent,
} from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Cards in the sorting step. Fewer than five and a direction shows up once,
 * which reads as a quiz question rather than as a rule; more than seven and
 * the step outstays a child's patience.
 */
const MIN_SORT_ITEMS = 5;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isDirection = (value: unknown): value is BudgetDirection =>
  BUDGET_DIRECTIONS.includes(value as BudgetDirection);

const assertStep = (step: unknown, path: string): OnboardingStepContent => {
  if (!isRecord(step)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!ONBOARDING_STEPS.includes(step.id as OnboardingStepId)) {
    throw new Error(`${path}.id: unknown step "${String(step.id)}"`);
  }
  if (!isNonEmptyString(step.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (!isNonEmptyString(step.line)) {
    throw new Error(`${path}.line: the pet says something on every step`);
  }

  return step as unknown as OnboardingStepContent;
};

const assertDecision = (decision: unknown, path: string): DecisionContent => {
  if (!isRecord(decision)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isDirection(decision.id)) {
    throw new Error(`${path}.id: unknown direction "${String(decision.id)}"`);
  }
  for (const field of ['title', 'example', 'hint'] as const) {
    if (!isNonEmptyString(decision[field])) {
      throw new Error(`${path}.${field}: non-empty string required`);
    }
  }

  return decision as unknown as DecisionContent;
};

const assertItem = (item: unknown, path: string): SortItemContent => {
  if (!isRecord(item)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(item.id)) {
    throw new Error(`${path}.id: non-empty string required`);
  }
  if (!isNonEmptyString(item.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (!isDirection(item.direction)) {
    throw new Error(
      `${path}.direction: unknown direction "${String(item.direction)}"`,
    );
  }
  // Without it a miss would leave the child with a shrug instead of a rule,
  // which is the whole point of the step.
  if (!isNonEmptyString(item.explanation)) {
    throw new Error(`${path}.explanation: every item explains its basket`);
  }

  return item as unknown as SortItemContent;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/onboarding.json` (or a fixture shaped like it).
 *
 * Onboarding is the first screen a child ever sees, and a missing line there
 * is a dead end with no way back — so a broken file fails here, in the tests,
 * and never on the device (3.2).
 */
export const assertOnboardingContent = (data: unknown): OnboardingFile => {
  if (!isRecord(data)) {
    throw new Error('onboarding content: must be an object');
  }
  if (!Array.isArray(data.steps)) {
    throw new Error('onboarding content: "steps" must be an array');
  }
  if (!Array.isArray(data.decisions)) {
    throw new Error('onboarding content: "decisions" must be an array');
  }
  if (!Array.isArray(data.items)) {
    throw new Error('onboarding content: "items" must be an array');
  }

  const steps = data.steps.map((step, index) =>
    assertStep(step, `steps[${index}]`),
  );
  const stepIds = new Set(steps.map((step) => step.id));
  if (stepIds.size !== steps.length) {
    throw new Error('onboarding content: duplicate step id');
  }
  for (const id of ONBOARDING_STEPS) {
    if (!stepIds.has(id)) {
      throw new Error(`onboarding content: step "${id}" is missing`);
    }
  }

  const decisions = data.decisions.map((decision, index) =>
    assertDecision(decision, `decisions[${index}]`),
  );
  const decisionIds = new Set(decisions.map((decision) => decision.id));
  // Exactly three, no fewer and no more: the three words of 2.5.1 are the same
  // three the budget screen, the shop and the summary speak — docs/budget.md.
  if (decisionIds.size !== BUDGET_DIRECTIONS.length) {
    throw new Error(
      `onboarding content: need one decision per direction — 2.5.1`,
    );
  }

  const items = data.items.map((item, index) =>
    assertItem(item, `items[${index}]`),
  );
  const itemIds = new Set<string>();
  for (const item of items) {
    if (itemIds.has(item.id)) {
      throw new Error(`items: duplicate id "${item.id}"`);
    }
    itemIds.add(item.id);
  }
  if (items.length < MIN_SORT_ITEMS) {
    throw new Error(
      `onboarding content: need at least ${MIN_SORT_ITEMS} sorting items`,
    );
  }
  for (const direction of BUDGET_DIRECTIONS) {
    if (!items.some((item) => item.direction === direction)) {
      throw new Error(
        `onboarding content: nothing to sort into "${direction}"`,
      );
    }
  }

  return { steps, decisions, items };
};

export { MIN_SORT_ITEMS };
