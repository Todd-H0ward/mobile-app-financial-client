import { describe, expect, it } from 'vitest';

import { PET_MOOD_NAMES } from '@/entities/pet';
import { ROBOT_DOG_ACTIONS } from '@/entities/robot-dog';

import { petActionFor } from './pet-action';

// ═══════════════════════════════════════════
// 1. Every mood reaches a clip the model has
// ═══════════════════════════════════════════

describe('petActionFor', () => {
  it('answers every mood with a clip the dog actually carries', () => {
    for (const mood of PET_MOOD_NAMES) {
      expect(ROBOT_DOG_ACTIONS).toContain(petActionFor(mood, 'idle'));
    }
  });

  it('lets the settings switch drive while there is no pet yet', () => {
    for (const chosen of ROBOT_DOG_ACTIONS) {
      expect(petActionFor(null, chosen)).toBe(chosen);
    }
  });

  it('ignores the switch once the pet has a mood of its own', () => {
    expect(petActionFor('sad', 'joy')).toBe('sad');
    expect(petActionFor('proud', 'sad')).toBe('joy');
  });

  it('shows trouble for both of the unhappy moods', () => {
    expect(petActionFor('sad', 'idle')).toBe('sad');
    expect(petActionFor('uncomfortable', 'idle')).toBe('sad');
  });

  it('paces when the pet is bored, so the child goes looking for a chore', () => {
    expect(petActionFor('bored', 'idle')).toBe('walk');
  });
});
