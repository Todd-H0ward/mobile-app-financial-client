import { ROBOT_DOG_STAGES, type RobotDogStage } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** What the child has actually decided, counted across every finished period. */
interface GrowthFacts {
  /** Periods finished. Counts the whole history, never resets. */
  periods: number;
  /** Distinct goals reached. The same goal twice is still one goal. */
  goalsReached: number;
  /** Periods that ended with no direction overspent, see budget.md. */
  plansKept: number;
}

/** What a stage asks for. Every condition must be met, none of them alone. */
type GrowthRule = GrowthFacts;

/** What is still missing before the next stage, as numbers to show. */
interface GrowthProgress {
  next: RobotDogStage;
  /** Periods still to finish. 0 means this condition is already met. */
  periods: number;
  /** Goals still to reach. */
  goalsReached: number;
  /** Plans still to keep. */
  plansKept: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The growth formula, docs/robot-dog.md. */
const GROWTH_RULES: Record<RobotDogStage, GrowthRule> = {
  basic: { periods: 0, goalsReached: 0, plansKept: 0 },
  upgraded: { periods: 2, goalsReached: 1, plansKept: 1 },
  complete: { periods: 4, goalsReached: 2, plansKept: 3 },
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isEarned = (stage: RobotDogStage, facts: GrowthFacts) => {
  const rule = GROWTH_RULES[stage];

  return (
    facts.periods >= rule.periods &&
    facts.goalsReached >= rule.goalsReached &&
    facts.plansKept >= rule.plansKept
  );
};

/** How far along the tuple a stage sits. `basic` is 0. */
const rank = (stage: RobotDogStage) => ROBOT_DOG_STAGES.indexOf(stage);

// ═══════════════════════════════════════════
// GROWTH
// ═══════════════════════════════════════════

/** The highest stage the facts have earned. */
export const stageFor = (facts: GrowthFacts): RobotDogStage =>
  [...ROBOT_DOG_STAGES].reverse().find((stage) => isEarned(stage, facts)) ??
  'basic';

/** The stage the dog holds after settlement. */
export const growRobotDog = (
  current: RobotDogStage,
  facts: GrowthFacts,
): RobotDogStage => {
  const earned = stageFor(facts);

  return rank(earned) > rank(current) ? earned : current;
};

/** What is still missing before the next stage, or `null` at the last one. */
export const progressToNextStage = (
  current: RobotDogStage,
  facts: GrowthFacts,
): GrowthProgress | null => {
  const next = ROBOT_DOG_STAGES[rank(current) + 1];
  if (!next) return null;

  const rule = GROWTH_RULES[next];

  return {
    next,
    periods: Math.max(rule.periods - facts.periods, 0),
    goalsReached: Math.max(rule.goalsReached - facts.goalsReached, 0),
    plansKept: Math.max(rule.plansKept - facts.plansKept, 0),
  };
};

/**
 * Stage to celebrate after settlement, or `null` when nothing moved.
 * A jump past a middle stage shows the highest one earned (2.5.10).
 */
export const stageTransition = (
  before: RobotDogStage,
  after: RobotDogStage,
): Exclude<RobotDogStage, 'basic'> | null => {
  if (rank(after) <= rank(before) || after === 'basic') return null;
  return after;
};

export type { GrowthFacts, GrowthProgress, GrowthRule };
export { GROWTH_RULES };
