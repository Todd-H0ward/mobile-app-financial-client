import { describe, expect, it } from 'vitest';

import { ROBOT_DOG_STAGES } from '@/entities/robot-dog';

import { createInitialUser } from '../initial-user';
import { PERIOD_PHASES } from '../types';

import { isUserSave } from './validate';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('isUserSave', () => {
  it('accepts the starting user', () => {
    expect(isUserSave(createInitialUser())).toBe(true);
  });

  it('rejects a save with a field of the wrong type', () => {
    const save = createInitialUser();

    expect(
      isUserSave({ ...save, wallet: { balance: null, history: [] } }),
    ).toBe(false);
    expect(isUserSave({ ...save, period: { ...save.period, plan: {} } })).toBe(
      false,
    );
    expect(isUserSave({ ...save, history: null })).toBe(false);
  });

  it('rejects a save whose enum field holds an unknown value', () => {
    // JSON has no enums: a hand-edited or corrupted file can hold any
    // string, and the screens switch on these values.
    const save = createInitialUser();

    expect(
      isUserSave({ ...save, period: { ...save.period, phase: 'banana' } }),
    ).toBe(false);
    // `settlement` is not a phase a save can hold — it is a step between two.
    expect(
      isUserSave({ ...save, period: { ...save.period, phase: 'settlement' } }),
    ).toBe(false);
    expect(
      isUserSave({ ...save, robot: { ...save.robot, stage: 'elder' } }),
    ).toBe(false);
  });

  it('accepts every value the enums actually allow', () => {
    const save = createInitialUser();

    for (const phase of PERIOD_PHASES) {
      expect(isUserSave({ ...save, period: { ...save.period, phase } })).toBe(
        true,
      );
    }
    for (const stage of ROBOT_DOG_STAGES) {
      expect(isUserSave({ ...save, robot: { ...save.robot, stage } })).toBe(
        true,
      );
    }
  });

  it('rejects anything that is not an object', () => {
    expect(isUserSave(null)).toBe(false);
    expect(isUserSave(7)).toBe(false);
    expect(isUserSave([createInitialUser()])).toBe(false);
  });
});
