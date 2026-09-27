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

/** The factor range, 6…9 — docs/parents.md. */
const GATE_MIN = 6;
const GATE_MAX = 9;

// ═══════════════════════════════════════════
// GATE
// ═══════════════════════════════════════════

/** A fresh question for the barrier. */
export const makeGateChallenge = (
  random: RandomSource = Math.random,
): GateChallenge => {
  const span = GATE_MAX - GATE_MIN + 1;
  const pick = () => GATE_MIN + Math.floor(random() * span);

  const left = pick();
  const right = pick();

  return { left, right, answer: left * right };
};

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
