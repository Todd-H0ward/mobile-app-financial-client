import { describe, expect, it } from 'vitest';

import { ROBOT_DOG_STAGES } from '@/entities/robot-dog';

import { createInitialUser, USER_SAVE_VERSION } from '../initial-user';
import { PERIOD_PHASES } from '../types';

import { isUserSave, migrateUser } from './migrations';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A save from a build before versioning: no `version`, no settings. */
const legacySave = (): Record<string, unknown> => {
  const save: Record<string, unknown> = {
    ...createInitialUser({ playerName: 'Аня' }),
  };

  delete save.version;
  delete save.ownedItemIds;
  delete save.settings;

  return save;
};

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('migrateUser', () => {
  it('keeps learned foundations when repeated sectors become new exercises', () => {
    const save = {
      ...createInitialUser(),
      version: 9,
      completedLessonCells: ['0-0-0', '1-0-0', '2-4-5'],
    };
    const migrated = migrateUser(save, 9);
    expect(migrated?.completedLessonCells).toEqual(['0-0-0', '0-4-5']);
    expect(migrated?.wallet).toEqual(save.wallet);
    expect(migrated?.platform).toEqual(save.platform);
  });
  it('leaves a save of the current version as it is', () => {
    const save = createInitialUser({ playerName: 'Аня', createdAt: 42 });

    expect(migrateUser(save, USER_SAVE_VERSION)).toEqual(save);
  });

  it('runs the v0 step: fills the missing fields, keeps what the player earned', () => {
    const migrated = migrateUser(legacySave(), 0);

    expect(migrated?.version).toBe(USER_SAVE_VERSION);
    // Taken from the starting profile.
    expect(migrated?.ownedItemIds).toEqual([]);
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

  it('runs the v5 step: the pet becomes the robot, the house goes', () => {
    const {
      robot: _robot,
      ownedItemIds: _owned,
      ...rest
    } = createInitialUser({
      playerName: 'Аня',
    });
    const v5 = {
      ...rest,
      version: 5,
      pet: {
        species: 'cat',
        color: 'sand',
        pattern: 'solid',
        name: 'Кекс',
        traitIds: ['chilly'],
        stage: 'teen',
        celebratedStage: 'teen',
        comfort: 0.4,
        spirit: 0.7,
      },
      home: {
        temperature: 0.8,
        insulationIds: ['window'],
        furnitureIds: ['game-console'],
        lastBilledPeriod: 2,
      },
      settings: {
        ...rest.settings,
        robotSkin: undefined,
        robotAction: undefined,
        petSkin: 'arctic',
        petAction: 'walk',
      },
    };

    const migrated = migrateUser(v5, 5);

    expect(migrated?.robot).toEqual({
      assembly: { head: 0, body: 0, legs: 0 },
      name: 'Кекс',
      stage: 'upgraded',
      charge: 0.4,
      spirit: 0.7,
    });
    expect(migrated?.ownedItemIds).toEqual(['game-console']);
    expect(migrated?.settings.robotSkin).toBe('arctic');
    expect(migrated?.settings.robotAction).toBe('walk');
    expect(migrated).not.toHaveProperty('pet');
    expect(migrated).not.toHaveProperty('home');
  });

  it('rejects anything that is not an object', () => {
    expect(isUserSave(null)).toBe(false);
    expect(isUserSave(7)).toBe(false);
    expect(isUserSave([createInitialUser()])).toBe(false);
  });
});
