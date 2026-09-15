import { describe, expect, it } from 'vitest';

import {
  isPlayerNameValid,
  normalizePlayerName,
  PLAYER_NAME_MAX_LENGTH,
  validatePlayerName,
} from './player-name';

// ═══════════════════════════════════════════
// 1. Normalising
// ═══════════════════════════════════════════

describe('normalizePlayerName', () => {
  it('drops the spaces around the name', () => {
    expect(normalizePlayerName('  Маша  ')).toBe('Маша');
  });

  it('keeps a space inside the name, but only one', () => {
    expect(normalizePlayerName('Маша   К')).toBe('Маша К');
  });

  it('caps the length instead of refusing a long name', () => {
    expect(normalizePlayerName('Маша'.repeat(10))).toHaveLength(
      PLAYER_NAME_MAX_LENGTH,
    );
  });

  it('leaves an emoji name alone — it is a game name, not a document', () => {
    expect(normalizePlayerName('🐱')).toBe('🐱');
  });
});

// ═══════════════════════════════════════════
// 2. Validating
// ═══════════════════════════════════════════

describe('validatePlayerName', () => {
  it('accepts a one-letter name', () => {
    expect(validatePlayerName('М')).toBe('ok');
    expect(isPlayerNameValid('М')).toBe(true);
  });

  it('rejects an empty field and one holding only spaces', () => {
    for (const raw of ['', '   ', '\n\t']) {
      expect(validatePlayerName(raw)).toBe('empty');
      expect(isPlayerNameValid(raw)).toBe(false);
    }
  });

  it('accepts anything the normalizer keeps', () => {
    for (const raw of ['Маша', ' Петя ', 'Ян К']) {
      expect(validatePlayerName(raw)).toBe('ok');
    }
  });
});
