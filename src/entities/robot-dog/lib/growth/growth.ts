import { ROBOT_DOG_STAGES, type RobotDogStage } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * What the child has actually decided, counted across every finished period.
 *
 * Deliberately three counters and no dates: growth is earned by decisions, not
 * by how long the app stayed open — see the first property below.
 */
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

/**
 * The growth formula, docs/robot-dog.md.
 *
 * Three properties hold, and each is a rule about the child rather than about
 * the numbers:
 *
 * 1. **Waiting is not a condition.** Every counter is a decision the child
 *    made; none of them is a clock. Holding the app open earns nothing.
 * 2. **Stages never go backwards** — requirement 2.2 forbids wiping progress.
 *    `growRobotDog` enforces it even when the facts say otherwise.
 * 3. **The reason is always nameable**, which is what `progressToNextStage`
 *    exists for: the screen shows what is missing in whole numbers.
 */
const GROWTH_RULES: Record<RobotDogStage, GrowthRule> = {
  basic: { periods: 0, goalsReached: 0, plansKept: 0 },
  upgraded: { periods: 2, goalsReached: 1, plansKept: 1 },
  complete: { periods: 4, goalsReached: 2, plansKept: 3 },
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Whether the facts clear every condition of a stage. */
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

/**
 * The highest stage the facts have earned.
 *
 * Reads the tuple from the far end, so a child who cleared the complete
 * conditions is complete even if they somehow skipped an upgraded condition.
 */
export const stageFor = (facts: GrowthFacts): RobotDogStage =>
  [...ROBOT_DOG_STAGES].reverse().find((stage) => isEarned(stage, facts)) ??
  'basic';

/**
 * The stage the dog holds after settlement.
 *
 * Only ever upwards: a reset, a refund or a corrected history may lower the
 * facts, and none of that may take a stage away from a child — 2.2.
 */
export const growRobotDog = (
  current: RobotDogStage,
  facts: GrowthFacts,
): RobotDogStage => {
  const earned = stageFor(facts);

  return rank(earned) > rank(current) ? earned : current;
};

/**
 * What is still missing before the next stage, or `null` at the last one.
 *
 * Whole numbers, because they are read aloud to a child: «ещё одна достигнутая
 * цель», never a percentage and never a bar.
 */
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

export type { GrowthFacts, GrowthProgress, GrowthRule };
export { GROWTH_RULES };
