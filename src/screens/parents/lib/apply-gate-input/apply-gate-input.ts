import { type GateChallenge, isGateAnswerCorrect } from '@/entities/settings';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GateInputResult {
  /** Digits currently shown in the field. */
  typed: string;
  /** Whether the calm miss line should show. */
  isMissed: boolean;
  /** Open the section — the product matched. */
  didPass: boolean;
  /** Ask for a fresh question — a full wrong try. */
  didMiss: boolean;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Digits only — the number pad can still paste letters on some keyboards. */
const digitsOnly = (value: string) => value.replace(/\D/g, '');

/**
 * One keystroke (or paste) against the barrier.
 *
 * Keeps the field usable for a two-digit product: a miss only fires once the
 * typed width reaches the answer's width. Wrong try → clear + calm miss flag.
 * Typing again after a miss hides the line until the next full try.
 */
export const applyGateInput = (
  challenge: GateChallenge,
  next: string,
): GateInputResult => {
  const digits = digitsOnly(next);

  if (isGateAnswerCorrect(challenge, digits)) {
    return { typed: digits, isMissed: false, didPass: true, didMiss: false };
  }

  if (digits.length >= String(challenge.answer).length) {
    return { typed: '', isMissed: true, didPass: false, didMiss: true };
  }

  return { typed: digits, isMissed: false, didPass: false, didMiss: false };
};

export type { GateInputResult };
