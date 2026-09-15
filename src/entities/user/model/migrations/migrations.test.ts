import { describe, expect, it } from 'vitest';

import { createInitialUser, USER_SAVE_VERSION } from '../initial-user';
import { PERIOD_PHASES, PET_SPECIES } from '../types';

import { isUserSave, migrateUser } from './migrations';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A save from a build before versioning: no `version`, no home fields. */
const legacySave = (): Record<string, unknown> => {
  const save: Record<string, unknown> = {
    ...createInitialUser({ playerName: 'Аня' }),
  };

  delete save.version;
  delete save.home;
  delete save.settings;

  return save;
};

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('migrateUser', () => {
  it('leaves a save of the current version as it is', () => {
    const save = createInitialUser({ playerName: 'Аня', createdAt: 42 });

    expect(migrateUser(save, USER_SAVE_VERSION)).toEqual(save);
  });

  it('runs the v0 step: fills the missing fields, keeps what the player earned', () => {
    const migrated = migrateUser(legacySave(), 0);

    expect(migrated?.version).toBe(USER_SAVE_VERSION);
    // Taken from the starting profile.
    expect(migrated?.home.lastBilledPeriod).toBe(0);
    expect(migrated?.settings.isParentGateEnabled).toBe(true);
    // Earned by the player.
    expect(migrated?.playerName).toBe('Аня');
  });

  it('walks the whole chain: a save three releases old reaches the current schema', () => {
    // There is one step so far, but what is checked is the walk from version
    // zero to the current one rather than one particular step — so the test
    // survives v2 and v3 appearing.
    for (let version = 0; version <= USER_SAVE_VERSION; version += 1) {
      const migrated = migrateUser(
        version === 0 ? legacySave() : createInitialUser(),
        version,
      );

      expect(isUserSave(migrated)).toBe(true);
    }
  });

  it('gives a clean user instead of throwing on an unreadable save', () => {
    expect(migrateUser(undefined, 0)).toBeNull();
    expect(migrateUser('{broken', 0)).toBeNull();
    expect(migrateUser([], 0)).toBeNull();
    expect(migrateUser({ wallet: { balance: 'a lot' } }, 0)).toBeNull();
  });

  it('refuses a save from the future rather than guessing', () => {
    const save = createInitialUser();

    expect(migrateUser(save, USER_SAVE_VERSION + 1)).toBeNull();
  });
});

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
    // JSON has no enums: a hand-edited or half-migrated file can hold any
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
      isUserSave({ ...save, pet: { ...save.pet, species: 'dragon' } }),
    ).toBe(false);
    expect(isUserSave({ ...save, pet: { ...save.pet, stage: 'elder' } })).toBe(
      false,
    );
    expect(
      isUserSave({ ...save, pet: { ...save.pet, color: 'invisible' } }),
    ).toBe(false);
  });

  it('accepts every value the enums actually allow', () => {
    const save = createInitialUser();

    for (const phase of PERIOD_PHASES) {
      expect(isUserSave({ ...save, period: { ...save.period, phase } })).toBe(
        true,
      );
    }
    for (const species of PET_SPECIES) {
      expect(isUserSave({ ...save, pet: { ...save.pet, species } })).toBe(true);
    }
  });

  it('rejects anything that is not an object', () => {
    expect(isUserSave(null)).toBe(false);
    expect(isUserSave(7)).toBe(false);
    expect(isUserSave([createInitialUser()])).toBe(false);
  });
});
