import { clamp } from '@/shared/utils';

import type {
  RobotDogAxes,
  RobotDogMood,
  RobotDogMoodAxis,
  RobotDogMoodCauses,
  RobotDogMoodName,
  RobotDogReason,
} from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Below this an axis is a problem the dog shows. 0…1. */
const ROBOT_DOG_MOOD_LOW = 0.35;

/** At or above this on both axes the dog is proud. 0…1. */
const ROBOT_DOG_MOOD_HIGH = 0.7;

/**
 * Share of the gap an axis closes per settlement step, 0…1.
 *
 * The inertia docs/robot-dog.md makes mandatory: a face that follows the meter within
 * one frame reads as an indicator, not as a creature. At 0.35 a full swing
 * takes roughly three periods to land — a number worth one pass on a device.
 */
const ROBOT_DOG_EASE_RATE = 0.35;

/** Closer than this and the value snaps, so easing lands instead of crawling. */
const ROBOT_DOG_EASE_EPSILON = 0.001;

/**
 * The cause used when the caller names none.
 *
 * Coarser than what settlement knows — it cannot tell a flat battery from a skipped charge — but
 * never absent: a dog with nothing to say is a bug, not silence (docs/robot-dog.md).
 */
const DEFAULT_REASONS: Record<RobotDogMoodName, RobotDogReason> = {
  proud: 'plan-kept',
  content: 'charged',
  bored: 'nothing-to-do',
  tired: 'drained',
  sad: 'drained',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** How far past a low threshold a value fell, as 0…1 of the way to zero. */
const belowShare = (value: number) =>
  (ROBOT_DOG_MOOD_LOW - value) / ROBOT_DOG_MOOD_LOW;

/** How far past the high threshold a value rose, as 0…1 of the way to one. */
const aboveShare = (value: number) =>
  (value - ROBOT_DOG_MOOD_HIGH) / (1 - ROBOT_DOG_MOOD_HIGH);

/**
 * The cause to speak: the hint for the axis that decided, else the coarse one.
 *
 * A drained dog is charged before it is cheered up, so the charge cause wins
 * whenever both axes are down. A proud dog is proud of what the
 * child decided, not of a full battery, so there the heart cause leads.

 */
const reasonFor = (
  name: RobotDogMoodName,
  axis: RobotDogMoodAxis,
  causes: RobotDogMoodCauses,
): RobotDogReason => {
  const order =
    name === 'proud' || axis === 'spirit'
      ? [causes.spirit, axis === 'spirit' ? undefined : causes.charge]
      : [causes.charge, axis === 'both' ? causes.spirit : undefined];

  return order.find((reason) => reason !== undefined) ?? DEFAULT_REASONS[name];
};

// ═══════════════════════════════════════════
// MOOD
// ═══════════════════════════════════════════

/**
 * The state the two axes add up to, with the cause that is spoken aloud.
 *
 * Total and pure: every pair of numbers maps to a mood, and every mood carries
 * a reason — 2.5.10 asks for the explanation, not just the face.
 *
 * @param charge the battery: needs paid for this period, 0…1 (clamped)
 * @param spirit goal proximity, tasks done, how the period ended, 0…1 (clamped)
 * @param causes what settlement observed, when it knows more than the numbers
 */
export const moodFor = (
  charge: number,
  spirit: number,
  causes: RobotDogMoodCauses = {},
): RobotDogMood => {
  const body = clamp(charge, 0, 1);
  const heart = clamp(spirit, 0, 1);

  const isBodyLow = body < ROBOT_DOG_MOOD_LOW;
  const isHeartLow = heart < ROBOT_DOG_MOOD_LOW;

  let name: RobotDogMoodName;
  let axis: RobotDogMoodAxis;
  let intensity: number;

  if (isBodyLow && isHeartLow) {
    name = 'sad';
    axis = 'both';
    intensity = Math.max(belowShare(body), belowShare(heart));
  } else if (isBodyLow) {
    name = 'tired';
    axis = 'charge';
    intensity = belowShare(body);
  } else if (isHeartLow) {
    name = 'bored';
    axis = 'spirit';
    intensity = belowShare(heart);
  } else if (body >= ROBOT_DOG_MOOD_HIGH && heart >= ROBOT_DOG_MOOD_HIGH) {
    name = 'proud';
    axis = 'both';
    intensity = Math.min(aboveShare(body), aboveShare(heart));
  } else {
    name = 'content';
    axis = 'both';
    intensity = 0;
  }

  return {
    name,
    reason: reasonFor(name, axis, causes),
    axis,
    intensity: clamp(intensity, 0, 1),
  };
};

// ═══════════════════════════════════════════
// INERTIA
// ═══════════════════════════════════════════

/**
 * Moves a value part of the way to its target — the inertia of docs/robot-dog.md.
 *
 * Never overshoots and never jumps: with a rate below 1 a full swing always
 * takes more than one call, which is the whole point. Snaps within an epsilon
 * so the value lands on the target instead of crawling towards it forever.
 *
 * @param rate share of the gap closed by this call, 0…1 (clamped)
 */
export const easeTowards = (
  current: number,
  target: number,
  rate: number = ROBOT_DOG_EASE_RATE,
): number => {
  const next = current + (target - current) * clamp(rate, 0, 1);

  return Math.abs(target - next) < ROBOT_DOG_EASE_EPSILON ? target : next;
};

/**
 * Both axes eased towards their targets at once, clamped back into 0…1.
 *
 * What settlement calls: it works out where the dog *should* be after the
 * period, hands it in as `target`, and stores what comes back. Where the target
 * comes from is not this slice's business, which is what keeps `entities/robot-dog`
 * free of any import from `entities/user`.
 */
export const easeRobotDogAxes = (
  current: RobotDogAxes,
  target: RobotDogAxes,
  rate: number = ROBOT_DOG_EASE_RATE,
): RobotDogAxes => ({
  charge: clamp(
    easeTowards(clamp(current.charge, 0, 1), clamp(target.charge, 0, 1), rate),
    0,
    1,
  ),
  spirit: clamp(
    easeTowards(clamp(current.spirit, 0, 1), clamp(target.spirit, 0, 1), rate),
    0,
    1,
  ),
});

export {
  ROBOT_DOG_EASE_EPSILON,
  ROBOT_DOG_EASE_RATE,
  ROBOT_DOG_MOOD_HIGH,
  ROBOT_DOG_MOOD_LOW,
};
