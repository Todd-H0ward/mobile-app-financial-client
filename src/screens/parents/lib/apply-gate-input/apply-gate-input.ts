import { type GateChallenge, isGateAnswerCorrect } from '@/entities/settings';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GateInputResult {
  typed: string;
  isMissed: boolean;
  didPass: boolean;
  didMiss: boolean;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Digits only — the number pad can still paste letters on some keyboards. */
const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** Miss only fires once typed width reaches the answer's width. */
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
