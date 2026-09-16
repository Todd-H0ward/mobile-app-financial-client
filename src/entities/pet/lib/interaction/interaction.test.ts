import { describe, expect, it } from 'vitest';

import { EMOTION_KEYS } from '../../model';

import { reactionFor, zoneAt } from './interaction';

// ═══════════════════════════════════════════
describe('zoneAt', () => {
  it('reads bands from the top of the pet', () => {
    expect(zoneAt(10, 100)).toBe('scruff');
    expect(zoneAt(30, 100)).toBe('head');
    expect(zoneAt(55, 100)).toBe('belly');
    expect(zoneAt(90, 100)).toBe('paws');
  });

  it('falls back to belly on a broken box', () => {
    expect(zoneAt(10, 0)).toBe('belly');
  });
});

describe('reactionFor', () => {
  it('never picks a face outside the catalogue', () => {
    const kinds = ['poke', 'stroke', 'lift'] as const;
    const zones = ['scruff', 'head', 'belly', 'paws'] as const;

    for (const kind of kinds) {
      for (const zone of zones) {
        expect(EMOTION_KEYS).toContain(reactionFor(kind, zone).emotion);
      }
    }
  });

  it('lifts into a dangled face for any zone', () => {
    expect(reactionFor('lift', 'belly').emotion).toBe('dangled');
  });

  it('strokes the head into loved, the belly into tickled', () => {
    expect(reactionFor('stroke', 'head').emotion).toBe('loved');
    expect(reactionFor('stroke', 'belly').emotion).toBe('tickled');
  });

  it('keeps every reaction timed, so the mood can return', () => {
    expect(reactionFor('poke', 'head').durationMs).toBeGreaterThan(0);
  });
});
