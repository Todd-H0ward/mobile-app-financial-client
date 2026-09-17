import type { BudgetDirection } from '@/entities/economy';

import type {
  DecisionContent,
  OnboardingStepContent,
  OnboardingStepId,
  SortItemContent,
} from '../../model';
import { assertOnboardingContent } from '../schema';

import ONBOARDING_CONTENT from '@/content/onboarding.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const CONTENT = assertOnboardingContent(ONBOARDING_CONTENT);

export const listOnboardingSteps = (): readonly OnboardingStepContent[] =>
  CONTENT.steps;

/** One step by id. `undefined` only if the content lost a row after validation. */
export const getOnboardingStep = (
  id: OnboardingStepId,
): OnboardingStepContent | undefined => CONTENT.steps.find((s) => s.id === id);

/** The three directions, in the order they are shown to the child. */
export const listDecisions = (): readonly DecisionContent[] =>
  CONTENT.decisions;

export const getDecision = (id: BudgetDirection): DecisionContent | undefined =>
  CONTENT.decisions.find((decision) => decision.id === id);

export const listSortItems = (): readonly SortItemContent[] => CONTENT.items;
