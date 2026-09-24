import { describe, expect, it } from 'vitest';

import type { GateChallenge } from '@/entities/settings';

import { applyGateInput } from './apply-gate-input';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const challenge: GateChallenge = { left: 7, right: 8, answer: 56 };

// ═══════════════════════════════════════════
// The four actions of the demo scenario
// ═══════════════════════════════════════════

describe('applyGateInput', () => {
  it('keeps a partial answer so a two-digit product can be typed', () => {
    expect(applyGateInput(challenge, '5')).toEqual({
      typed: '5',
      isMissed: false,
      didPass: false,
      didMiss: false,
    });
  });

  it('strips non-digits from a paste', () => {
    expect(applyGateInput(challenge, '5a')).toEqual({
      typed: '5',
      isMissed: false,
      didPass: false,
      didMiss: false,
    });
  });

  it('misses calmly on a full wrong answer — clear field, show the line', () => {
    expect(applyGateInput(challenge, '55')).toEqual({
      typed: '',
      isMissed: true,
      didPass: false,
      didMiss: true,
    });
  });

  it('passes on the product', () => {
    expect(applyGateInput(challenge, '56')).toEqual({
      typed: '56',
      isMissed: false,
      didPass: true,
      didMiss: false,
    });
  });

  it('walks the demo path: wrong → right', () => {
    const wrong = applyGateInput(challenge, '12');
    expect(wrong.didMiss).toBe(true);
    expect(wrong.isMissed).toBe(true);

    const nextTry = applyGateInput(challenge, '5');
    expect(nextTry.isMissed).toBe(false);
    expect(nextTry.didPass).toBe(false);

    const right = applyGateInput(challenge, '56');
    expect(right.didPass).toBe(true);
  });
});
