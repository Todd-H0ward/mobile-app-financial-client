import { describe, expect, it } from 'vitest';

import {
  isPetNameValid,
  normalizePetName,
  PET_NAME_MAX_LENGTH,
  validatePetName,
} from './pet-name';

describe('normalizePetName', () => {
  it('applies the shared rule: trimmed, collapsed, capped', () => {
    expect(normalizePetName('  Мур   зик  ')).toBe('Мур зик');
  });

  it('caps at the pet\u2019s own limit, shorter than the player\u2019s', () => {
    expect(normalizePetName('А'.repeat(30))).toHaveLength(PET_NAME_MAX_LENGTH);
  });
});

describe('validatePetName', () => {
  it('accepts a single letter — «Б» is a perfectly good cat', () => {
    expect(validatePetName('Б')).toBe('ok');
    expect(isPetNameValid('Б')).toBe(true);
  });

  it('names the reason instead of dying silently on spaces only', () => {
    expect(validatePetName('   ')).toBe('empty');
    expect(isPetNameValid('   ')).toBe(false);
  });

  it('refuses an empty field', () => {
    expect(validatePetName('')).toBe('empty');
  });
});
