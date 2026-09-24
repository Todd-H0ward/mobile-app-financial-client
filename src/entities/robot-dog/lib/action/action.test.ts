import { describe, expect, it } from 'vitest';

import { ROBOT_DOG_ACTIONS, ROBOT_DOG_MOOD_NAMES } from '../../model';

import { actionForMood } from './action';

// ═══════════════════════════════════════════
// 1. Every mood reaches a clip the model has
// ═══════════════════════════════════════════

describe('actionForMood', () => {
  it('answers every mood with a clip the dog actually carries', () => {
    for (const mood of ROBOT_DOG_MOOD_NAMES) {
      expect(ROBOT_DOG_ACTIONS).toContain(actionForMood(mood, 'idle'));
    }
  });

  it('lets the settings switch drive while there is no profile yet', () => {
    for (const chosen of ROBOT_DOG_ACTIONS) {
      expect(actionForMood(null, chosen)).toBe(chosen);
    }
  });

  it('ignores the switch once the dog has a mood of its own', () => {
    expect(actionForMood('sad', 'joy')).toBe('sad');
    expect(actionForMood('proud', 'sad')).toBe('joy');
  });

  it('shows trouble for both of the unhappy moods', () => {
    expect(actionForMood('sad', 'idle')).toBe('sad');
    expect(actionForMood('tired', 'idle')).toBe('sad');
  });

  it('paces when the dog is bored, so the child goes looking for a chore', () => {
    expect(actionForMood('bored', 'idle')).toBe('walk');
  });
});
