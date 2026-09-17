// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One multiplication a grown-up answers without thinking. */
interface GateChallenge {
  /** Left factor, `GATE_MIN`…`GATE_MAX`. */
  left: number;
  /** Right factor, same range. */
  right: number;
  /** What the two make. Kept beside them so nothing has to recompute it. */
  answer: number;
}

/** A number source, so a test can hand the gate a fixed sequence. */
type RandomSource = () => number;

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The factor range, 6…9 — docs/parents.md.
 *
 * Deliberately past the part of the table a first-grader knows cold: the
 * barrier has to stop a child who is guessing, not a grown-up who is reading.
 * Anything below six (2 × 3) a seven-year-old walks straight through.
 */
const GATE_MIN = 6;
const GATE_MAX = 9;

// ═══════════════════════════════════════════
// GATE
// ═══════════════════════════════════════════

/**
 * A fresh question for the barrier.
 *
 * `random` is a parameter rather than a call to `Math.random` inside, so the
 * generated range can actually be asserted instead of trusted.
 */
export const makeGateChallenge = (
  random: RandomSource = Math.random,
): GateChallenge => {
  const span = GATE_MAX - GATE_MIN + 1;
  const pick = () => GATE_MIN + Math.floor(random() * span);

  const left = pick();
  const right = pick();

  return { left, right, answer: left * right };
};

/**
 * Whether what was typed opens the barrier.
 *
 * Whitespace is forgiven and anything that is not a whole number is simply
 * wrong — never an error state. A wrong answer clears the field and that is
 * the whole punishment: no lockout, no timer, no frightening wording. There is
 * nothing behind this gate worth stealing (docs/privacy.md); it exists to stop
 * a child wandering in, not to defend an account.
 */
export const isGateAnswerCorrect = (
  challenge: GateChallenge,
  input: string,
): boolean => {
  const typed = input.trim();
  if (!/^\d+$/.test(typed)) return false;

  return Number.parseInt(typed, 10) === challenge.answer;
};

export type { GateChallenge, RandomSource };
export { GATE_MAX, GATE_MIN };
