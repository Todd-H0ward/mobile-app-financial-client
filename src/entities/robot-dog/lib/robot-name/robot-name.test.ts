import { describe, expect, it } from 'vitest';

import {
  isRobotNameValid,
  normalizeRobotName,
  ROBOT_NAME_MAX_LENGTH,
  validateRobotName,
} from './robot-name';

describe('normalizeRobotName', () => {
  it('applies the shared rule: trimmed, collapsed, capped', () => {
    expect(normalizeRobotName('  Мур   зик  ')).toBe('Мур зик');
  });

  it('caps at the dog\u2019s own limit, shorter than the player\u2019s', () => {
    expect(normalizeRobotName('А'.repeat(30))).toHaveLength(
      ROBOT_NAME_MAX_LENGTH,
    );
  });
});

describe('validateRobotName', () => {
  it('accepts a single letter — «Б» is a perfectly good robot', () => {
    expect(validateRobotName('Б')).toBe('ok');
    expect(isRobotNameValid('Б')).toBe(true);
  });

  it('names the reason instead of dying silently on spaces only', () => {
    expect(validateRobotName('   ')).toBe('empty');
    expect(isRobotNameValid('   ')).toBe(false);
  });

  it('refuses an empty field', () => {
    expect(validateRobotName('')).toBe('empty');
  });
});
