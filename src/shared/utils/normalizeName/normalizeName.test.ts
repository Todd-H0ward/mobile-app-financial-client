import { describe, expect, it } from 'vitest';

import { normalizeName } from './normalizeName';

describe('normalizeName', () => {
  it('drops the spaces around a name', () => {
    expect(normalizeName('  Аня  ', 12)).toBe('Аня');
  });

  it('collapses a run of spaces inside it', () => {
    expect(normalizeName('Мур   зик', 12)).toBe('Мур зик');
  });

  it('treats tabs and newlines as spaces too', () => {
    expect(normalizeName('Мур\t\nзик', 12)).toBe('Мур зик');
  });

  it('cuts to the limit it was given', () => {
    expect(normalizeName('Длинноеимяпитомца', 6)).toBe('Длинно');
  });

  it('gives an empty string back for spaces only', () => {
    expect(normalizeName('   ', 12)).toBe('');
  });

  it('leaves a name that is already clean alone', () => {
    expect(normalizeName('Кот', 12)).toBe('Кот');
  });
});
