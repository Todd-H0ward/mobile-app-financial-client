import { clamp } from '@/shared/utils';

import type {
  PetAxes,
  PetMood,
  PetMoodAxis,
  PetMoodCauses,
  PetMoodName,
  PetReason,
} from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Below this an axis is a problem the pet talks about. 0…1. */
const PET_MOOD_LOW = 0.35;

/** At or above this on both axes the pet is proud. 0…1. */
const PET_MOOD_HIGH = 0.7;

/**
 * Share of the gap an axis closes per settlement step, 0…1.
 *
 * The inertia docs/pet.md makes mandatory: a face that follows the meter within
 * one frame reads as an indicator, not as a creature. At 0.35 a full swing
 * takes roughly three periods to land — a number worth one pass on a device.
 */
const PET_EASE_RATE = 0.35;

/** Closer than this and the value snaps, so easing lands instead of crawling. */
const PET_EASE_EPSILON = 0.001;

/**
 * The cause used when the caller names none.
 *
 * Coarser than what settlement knows — it cannot tell cold from hungry — but
 * never absent: a pet with nothing to say is a bug, not silence (pet.md).
 */
const DEFAULT_REASONS: Record<PetMoodName, PetReason> = {
  proud: 'plan-kept',
  content: 'fed',
  bored: 'nothing-to-do',
  uncomfortable: 'hungry',
  sad: 'hungry',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** How far past a low threshold a value fell, as 0…1 of the way to zero. */
const belowShare = (value: number) => (PET_MOOD_LOW - value) / PET_MOOD_LOW;

/** How far past the high threshold a value rose, as 0…1 of the way to one. */
const aboveShare = (value: number) =>
  (value - PET_MOOD_HIGH) / (1 - PET_MOOD_HIGH);

/**
 * The cause to speak: the hint for the axis that decided, else the coarse one.
 *
 * A hungry pet is fed before it is cheered up, so the body cause wins whenever
 * both axes are down. A proud pet is proud of what it decided, not of dinner,
 * so there the heart cause leads instead.
 */
const reasonFor = (
  name: PetMoodName,
  axis: PetMoodAxis,
  causes: PetMoodCauses,
): PetReason => {
  const order =
    name === 'proud' || axis === 'spirit'
      ? [causes.spirit, axis === 'spirit' ? undefined : causes.comfort]
      : [causes.comfort, axis === 'both' ? causes.spirit : undefined];

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
 * @param comfort body: fed and warm, 0…1 (clamped)
 * @param spirit goal proximity, tasks done, how the period ended, 0…1 (clamped)
 * @param causes what settlement observed, when it knows more than the numbers
 */
export const moodFor = (
  comfort: number,
  spirit: number,
  causes: PetMoodCauses = {},
): PetMood => {
  const body = clamp(comfort, 0, 1);
  const heart = clamp(spirit, 0, 1);

  const isBodyLow = body < PET_MOOD_LOW;
  const isHeartLow = heart < PET_MOOD_LOW;

  let name: PetMoodName;
  let axis: PetMoodAxis;
  let intensity: number;

  if (isBodyLow && isHeartLow) {
    name = 'sad';
    axis = 'both';
    intensity = Math.max(belowShare(body), belowShare(heart));
  } else if (isBodyLow) {
    name = 'uncomfortable';
    axis = 'comfort';
    intensity = belowShare(body);
  } else if (isHeartLow) {
    name = 'bored';
    axis = 'spirit';
    intensity = belowShare(heart);
  } else if (body >= PET_MOOD_HIGH && heart >= PET_MOOD_HIGH) {
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
 * Moves a value part of the way to its target — the inertia of docs/pet.md.
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
  rate: number = PET_EASE_RATE,
): number => {
  const next = current + (target - current) * clamp(rate, 0, 1);

  return Math.abs(target - next) < PET_EASE_EPSILON ? target : next;
};

/**
 * Both axes eased towards their targets at once, clamped back into 0…1.
 *
 * What settlement calls: it works out where the pet *should* be after the
 * period, hands it in as `target`, and stores what comes back. Where the target
 * comes from is not this slice's business, which is what keeps `entities/pet`
 * free of any import from `entities/user`.
 */
export const easePetAxes = (
  current: PetAxes,
  target: PetAxes,
  rate: number = PET_EASE_RATE,
): PetAxes => ({
  comfort: clamp(
    easeTowards(
      clamp(current.comfort, 0, 1),
      clamp(target.comfort, 0, 1),
      rate,
    ),
    0,
    1,
  ),
  spirit: clamp(
    easeTowards(clamp(current.spirit, 0, 1), clamp(target.spirit, 0, 1), rate),
    0,
    1,
  ),
});

export { PET_EASE_EPSILON, PET_EASE_RATE, PET_MOOD_HIGH, PET_MOOD_LOW };
