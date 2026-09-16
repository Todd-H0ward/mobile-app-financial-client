import type { BudgetDirection } from '@/entities/economy';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The steps of onboarding, in the order the child walks them.
 *
 * A runtime tuple: the screen maps over it, and the schema checks that the
 * content file describes every step and invents none. The pet's look is not
 * here — that choice lives on the closed box at home (2.5.2), once.
 */
const ONBOARDING_STEPS = [
  'greeting',
  'sorting',
  'coins',
  'plan',
  'name',
] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Id of one onboarding step. */
type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

/** One step, as the content file describes it. No layout, only words — 3.2. */
interface OnboardingStepContent {
  /** Which step this is. Exactly one row per `ONBOARDING_STEPS` entry. */
  id: OnboardingStepId;
  /** Heading of the step, shown in the screen header. */
  title: string;
  /** The pet's line. The pet is the only voice in the app, see docs/pet.md. */
  line: string;
}

/** One of the three budget directions, explained in a child's words. */
interface DecisionContent {
  /** The direction itself. The same three ids the budget screens use. */
  id: BudgetDirection;
  /** Name shown everywhere in the game: «Нужное», «Хочется», «Копилка». */
  title: string;
  /** Two or three things that belong here, so the word gets a picture. */
  example: string;
  /** Why this direction exists. Shown under the basket and in the hint. */
  hint: string;
}

/** One card of the sorting step: a thing the child puts into a basket. */
interface SortItemContent {
  /** Stable id. The screen keeps progress by id, never by index. */
  id: string;
  /** What the child reads on the card. */
  title: string;
  /** The basket this card belongs to. */
  direction: BudgetDirection;
  /**
   * What the pet says when the card lands in the wrong basket. A rule, never
   * a verdict: nothing in this app tells a child they were wrong — 2.2, 3.5.
   */
  explanation: string;
}

/** The whole of `content/onboarding.json`. */
interface OnboardingFile {
  /** Every step, one row per id from `ONBOARDING_STEPS`. */
  steps: OnboardingStepContent[];
  /** Exactly three directions, in the order they are shown. */
  decisions: DecisionContent[];
  /** Cards of the sorting step. Every direction has at least one. */
  items: SortItemContent[];
}

export type {
  DecisionContent,
  OnboardingFile,
  OnboardingStepContent,
  OnboardingStepId,
  SortItemContent,
};
export { ONBOARDING_STEPS };
