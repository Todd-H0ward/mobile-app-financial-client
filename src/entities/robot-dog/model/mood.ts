// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The states the dog can be in. Requirement 2.5.10 asks for at least three.
 *
 * Five, because two axes make four corners plus a middle. Named after the
 * axes, not after the causes: *why* the dog is `tired` is the `reason`, and
 * the reason is what is explained to the child.
 */
const ROBOT_DOG_MOOD_NAMES = [
  'proud',
  'content',
  'bored',
  'tired',
  'sad',
] as const;

/**
 * Causes a mood can be explained by — the «краткое объяснение причины» of
 * 2.5.10, as ids. The wording is content's job, never this slice's.
 *
 * The first two are charge causes, the rest spirit causes.
 */
const ROBOT_DOG_REASONS = [
  'charged',
  'drained',
  'goal-near',
  'tasks-done',
  'plan-kept',
  'goal-far',
  'nothing-to-do',
  'plan-broken',
] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** The two axes the state is computed from, docs/robot-dog.md. */
interface RobotDogAxes {
  /** The battery: needs paid for. 0…1, eased — never jumps in one settlement. */
  charge: number;
  /** Everything else: goal proximity, tasks done, how the period ended. 0…1. */
  spirit: number;
}

/** One of the five states. */
type RobotDogMoodName = (typeof ROBOT_DOG_MOOD_NAMES)[number];

/** A cause id. The screen turns it into words; this slice never does. */
type RobotDogReason = (typeof ROBOT_DOG_REASONS)[number];

/** Which axis decided the mood. `both` — the two agreed. */
type RobotDogMoodAxis = 'charge' | 'spirit' | 'both';

/**
 * The specific causes the caller knows about, when it knows them.
 *
 * Without them the mood still names a cause, just a coarser one — the dog is
 * never mute.
 */
interface RobotDogMoodCauses {
  /** Why the battery is where it is. Used when the mood is charge-driven. */
  charge?: RobotDogReason;
  /** Why the spirit is. Used when the mood is spirit-driven. */
  spirit?: RobotDogReason;
}

/** A state with its cause attached — the pair requirement 2.5.10 asks for. */
interface RobotDogMood {
  name: RobotDogMoodName;
  /** The named cause, the thing that is explained. Never absent. */
  reason: RobotDogReason;
  /** Which axis produced it — the screen highlights that meter. */
  axis: RobotDogMoodAxis;
  /** How far past the threshold, 0…1. Drives how strongly the clip reads. */
  intensity: number;
}

export type {
  RobotDogAxes,
  RobotDogMood,
  RobotDogMoodAxis,
  RobotDogMoodCauses,
  RobotDogMoodName,
  RobotDogReason,
};
export { ROBOT_DOG_MOOD_NAMES, ROBOT_DOG_REASONS };
