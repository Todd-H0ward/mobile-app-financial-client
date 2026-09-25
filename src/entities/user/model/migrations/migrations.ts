import { PLATFORM_GOAL_ID, PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import {
  DEFAULT_ROBOT_ASSEMBLY,
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
  isRobotAssembly,
  isRobotDogAction,
  isRobotDogSkin,
  ROBOT_DOG_STAGES,
  type RobotDogStage,
} from '@/entities/robot-dog';

import { isFiniteNumber, isOneOf, isRecord } from '@/shared/utils';

import { createInitialUser, USER_SAVE_VERSION } from '../initial-user';
import { PERIOD_PHASES, type UserSave } from '../types';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One migration step: a save of version N in, version N+1 out. */
type MigrationStep = (save: Record<string, unknown>) => Record<string, unknown>;

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The pet's growth stages, as the robot's build stages — for the v5 step. */
const STAGE_FROM_PET: Record<string, RobotDogStage> = {
  baby: 'basic',
  teen: 'upgraded',
  adult: 'complete',
};

// ═══════════════════════════════════════════
// MIGRATIONS
// ═══════════════════════════════════════════

/**
 * One step at a time: the key is the version coming in, the value is how to get
 * to the next one.
 *
 * The chain is what carries a player who skipped three releases all the way to
 * the current schema: `v0 → v1 → v2 → …`. A single jump straight to the latest
 * version cannot do that.
 */
const MIGRATIONS: Record<number, MigrationStep> = {
  11: (save) => ({
    ...save,
    version: 12,
    arcade: { ...(isRecord(save.arcade) ? save.arcade : {}), paidWeek: -1 },
  }),
  10: (save) => ({
    ...save,
    version: 11,
    robot: {
      ...(isRecord(save.robot) ? save.robot : {}),
      assembly: { ...DEFAULT_ROBOT_ASSEMBLY },
    },
  }),
  // The old arena repeated the first 30 lessons in every sector. Preserve
  // that learned content without marking new practice exercises completed.
  // Also backfills modules / arcade scores for saves that reached v9 via the
  // workshop-only step on this branch.
  9: (save) => {
    const arcade = isRecord(save.arcade) ? save.arcade : {};
    return {
      ...save,
      version: 10,
      modules: isRecord(save.modules) ? save.modules : { owned: [], tier: 0 },
      arcade: {
        ...arcade,
        scores: isRecord(arcade.scores)
          ? arcade.scores
          : { snake: [], spacewarMs: [] },
      },
      completedLessonCells: Array.isArray(save.completedLessonCells)
        ? [
            ...new Set(
              save.completedLessonCells
                .filter(
                  (key): key is string =>
                    typeof key === 'string' && /^[0-2]-[0-4]-[0-5]$/.test(key),
                )
                .map((key) => `0${key.slice(1)}`),
            ),
          ]
        : [],
    };
  },
  8: (save) => ({
    ...save,
    version: 9,
    modules: { owned: [], tier: 0 },
    completedLessonCells: [],
    arcade: {
      ...(isRecord(save.arcade) ? save.arcade : {}),
      scores: { snake: [], spacewarMs: [] },
    },
  }),
  7: (save) => ({
    ...save,
    version: 8,
    arcade: { sequence: 0, active: null, paidDay: -1, paidCount: 0 },
  }),
  // v6 had only a local preview level; no money or earned progress is removed.
  6: (save) => {
    const savings = isRecord(save.savings) ? save.savings : {};
    const goals = Array.isArray(savings.goals) ? savings.goals : [];
    return {
      ...save,
      version: 7,
      platform: { level: 0, receipts: [] },
      savings: {
        ...savings,
        goals: goals.some(
          (goal) => isRecord(goal) && goal.goalId === PLATFORM_GOAL_ID,
        )
          ? goals
          : [
              ...goals,
              { goalId: PLATFORM_GOAL_ID, saved: 0, reachedInPeriod: null },
            ],
      },
    };
  },
  // v0 — a save from a build before versioning: fewer fields, no `version`.
  // Missing fields come from the starting profile; what the player earned stays.
  0: (save) => ({ ...createInitialUser(), ...save, version: 1 }),

  // v1 — the pet grew a `celebratedStage`. An existing pet is taken as already
  // celebrated: a child who has been playing for a week must not be handed a
  // ceremony for a stage they reached three periods ago.
  1: (save) => {
    const pet = isRecord(save.pet) ? save.pet : {};

    return {
      ...save,
      pet: { ...pet, celebratedStage: pet.stage ?? 'baby' },
      version: 2,
    };
  },

  // v2 — the wallet grew `entryCount`, the counter `WalletEntry.id` is built
  // from. A save from before this step never credited a named entry, so its
  // history is empty and the honest backfill is the length of that history —
  // zero, for every real save this migration will ever see.
  2: (save) => {
    const wallet = isRecord(save.wallet) ? save.wallet : {};
    const history = Array.isArray(wallet.history) ? wallet.history : [];

    return {
      ...save,
      wallet: {
        ...wallet,
        entryCount:
          typeof wallet.entryCount === 'number'
            ? wallet.entryCount
            : history.length,
      },
      version: 3,
    };
  },

  // v3 — chores engine: active task + per-period completions (2.5.8). Fresh
  // profiles get the first catalogue task; a mid-game save starts the same
  // way so the HUD never shows an empty slot for no reason.
  3: (save) => {
    const fresh = createInitialUser();

    return {
      ...save,
      tasks: fresh.tasks,
      version: 4,
    };
  },

  // v4 — the pet became a 3D robot dog with seven coats and four clips. An
  // existing profile has no opinion about either, so it gets the defaults: a
  // save from before this step never showed a dog at all.
  4: (save) => {
    const settings = isRecord(save.settings) ? save.settings : {};

    return {
      ...save,
      settings: {
        ...settings,
        petSkin: isRobotDogSkin(settings.petSkin)
          ? settings.petSkin
          : DEFAULT_ROBOT_DOG_SKIN,
        petAction: isRobotDogAction(settings.petAction)
          ? settings.petAction
          : DEFAULT_ROBOT_DOG_ACTION,
      },
      version: 5,
    };
  },

  // v5 — the game left the pet's house for the pit. The 2D pet's species,
  // coat, pattern and traits go; its name, stage and mood carry over to the
  // robot. The house goes too: no thermostat, no insulation, no bill. What
  // was bought and stays — the console, the puzzles — keeps unlocking the
  // arcade from `ownedItemIds`.
  5: (save) => {
    const pet = isRecord(save.pet) ? save.pet : {};
    const home = isRecord(save.home) ? save.home : {};
    const settings = isRecord(save.settings) ? save.settings : {};
    const { pet: _pet, home: _home, ...rest } = save;
    const { petSkin, petAction, ...keptSettings } = settings;
    const owned = Array.isArray(home.furnitureIds) ? home.furnitureIds : [];

    return {
      ...rest,
      robot: {
        name: typeof pet.name === 'string' ? pet.name : '',
        stage: STAGE_FROM_PET[String(pet.stage)] ?? 'basic',
        charge: isFiniteNumber(pet.comfort) ? pet.comfort : 1,
        spirit: isFiniteNumber(pet.spirit) ? pet.spirit : 1,
      },
      ownedItemIds: owned.filter((id): id is string => typeof id === 'string'),
      settings: {
        ...keptSettings,
        robotSkin: isRobotDogSkin(petSkin) ? petSkin : DEFAULT_ROBOT_DOG_SKIN,
        robotAction: isRobotDogAction(petAction)
          ? petAction
          : DEFAULT_ROBOT_DOG_ACTION,
      },
      version: 6,
    };
  },
};

// ═══════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════

const isPlatform = (value: unknown): boolean =>
  isRecord(value) &&
  Number.isInteger(value.level) &&
  typeof value.level === 'number' &&
  value.level >= 0 &&
  value.level <= PLATFORM_LEVEL_COUNT &&
  Array.isArray(value.receipts) &&
  value.receipts.length === value.level &&
  value.receipts.every(
    (receipt, index) =>
      isRecord(receipt) &&
      receipt.id === `platform:${index + 1}` &&
      receipt.level === index + 1 &&
      isFiniteNumber(receipt.amount) &&
      receipt.amount > 0 &&
      isFiniteNumber(receipt.savingsBefore) &&
      isFiniteNumber(receipt.savingsAfter) &&
      receipt.savingsAfter >= 0 &&
      receipt.savingsBefore - receipt.amount === receipt.savingsAfter &&
      isFiniteNumber(receipt.periodIndex) &&
      receipt.periodIndex >= 1 &&
      isFiniteNumber(receipt.at),
  );

const isBudget = (value: unknown): boolean =>
  isRecord(value) &&
  isFiniteNumber(value.needs) &&
  isFiniteNumber(value.wants) &&
  isFiniteNumber(value.savings);

const isRobot = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.name === 'string' &&
  isRobotAssembly(value.assembly) &&
  isOneOf(value.stage, ROBOT_DOG_STAGES) &&
  isFiniteNumber(value.charge) &&
  isFiniteNumber(value.spirit);

const isWallet = (value: unknown): boolean =>
  isRecord(value) &&
  isFiniteNumber(value.balance) &&
  Array.isArray(value.history) &&
  isFiniteNumber(value.entryCount);

const isSavings = (value: unknown): boolean =>
  isRecord(value) &&
  Array.isArray(value.goals) &&
  value.goals.every(
    (goal) =>
      isRecord(goal) &&
      typeof goal.goalId === 'string' &&
      isFiniteNumber(goal.saved),
  ) &&
  (value.activeGoalId === null || typeof value.activeGoalId === 'string') &&
  isFiniteNumber(value.depositsThisPeriod);

const isPeriod = (value: unknown): boolean =>
  isRecord(value) &&
  isFiniteNumber(value.index) &&
  isOneOf(value.phase, PERIOD_PHASES) &&
  isBudget(value.plan) &&
  isBudget(value.fact) &&
  isFiniteNumber(value.phaseEnteredAt);

const isSettings = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.isParentGateEnabled === 'boolean' &&
  typeof value.isSoundEnabled === 'boolean' &&
  typeof value.isAnimationEnabled === 'boolean' &&
  typeof value.isDemoMode === 'boolean' &&
  isRobotDogSkin(value.robotSkin) &&
  isRobotDogAction(value.robotAction);

const isTasks = (value: unknown): boolean =>
  isRecord(value) &&
  (value.activeTaskId === null || typeof value.activeTaskId === 'string') &&
  Array.isArray(value.completedThisPeriod) &&
  value.completedThisPeriod.every((id) => typeof id === 'string');

const isScores = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length <= 5 &&
  value.every((score) => Number.isSafeInteger(score) && score > 0);

const isArcade = (value: unknown): boolean =>
  isRecord(value) &&
  isRecord(value.scores) &&
  isScores(value.scores.snake) &&
  isScores(value.scores.spacewarMs) &&
  Number.isSafeInteger(value.sequence) &&
  Number(value.sequence) >= 0 &&
  Number.isSafeInteger(value.paidWeek) &&
  Number(value.paidWeek) >= -1 &&
  Number.isSafeInteger(value.paidDay) &&
  Number(value.paidDay) >= -1 &&
  Number.isInteger(value.paidCount) &&
  Number(value.paidCount) >= 0 &&
  Number(value.paidCount) <= 3 &&
  (value.active === null ||
    (isRecord(value.active) &&
      value.active.id === value.sequence &&
      Number(value.active.id) > 0 &&
      ['puzzle', 'snake', 'spacewar', 'market', 'weekly'].includes(
        String(value.active.gameId),
      )));

const isModules = (value: unknown): boolean =>
  isRecord(value) &&
  Array.isArray(value.owned) &&
  value.owned.every((id) => typeof id === 'string') &&
  (value.tier === 0 ||
    value.tier === 1 ||
    value.tier === 2 ||
    value.tier === 3);

/**
 * Checks the shape of the save, not its meaning: passing means no screen will
 * crash reading a field. Economic invariants (balance >= 0 and the rest) are
 * held by whoever changes those numbers.
 */
export const isUserSave = (value: unknown): value is UserSave =>
  isRecord(value) &&
  value.version === USER_SAVE_VERSION &&
  typeof value.playerName === 'string' &&
  isFiniteNumber(value.createdAt) &&
  isRobot(value.robot) &&
  isPlatform(value.platform) &&
  isArcade(value.arcade) &&
  Array.isArray(value.completedLessonCells) &&
  value.completedLessonCells.length <= 90 &&
  value.completedLessonCells.every(
    (key) => typeof key === 'string' && /^[0-2]-[0-4]-[0-5]$/.test(key),
  ) &&
  new Set(value.completedLessonCells).size ===
    value.completedLessonCells.length &&
  isWallet(value.wallet) &&
  isSavings(value.savings) &&
  isTasks(value.tasks) &&
  isPeriod(value.period) &&
  Array.isArray(value.history) &&
  Array.isArray(value.ownedItemIds) &&
  value.ownedItemIds.every((id) => typeof id === 'string') &&
  isModules(value.modules) &&
  isSettings(value.settings);

// ═══════════════════════════════════════════
// MIGRATE
// ═══════════════════════════════════════════

/**
 * Brings a save of any past version up to the current one.
 *
 * Returns `null` when the save is unreadable: a corrupted file gives a clean
 * profile rather than a crash at startup. `persist` gets that same `null` and
 * the store stays on its starting state.
 *
 * @param persisted whatever was sitting in storage
 * @param version the version it was written under
 */
export const migrateUser = (
  persisted: unknown,
  version: number,
): UserSave | null => {
  if (!isRecord(persisted)) return null;
  // A save from the future means the app was rolled back. There is nothing to
  // migrate downwards, and guessing is worse than starting over.
  if (!Number.isInteger(version) || version > USER_SAVE_VERSION) return null;

  let save = persisted;

  for (let from = Math.max(version, 0); from < USER_SAVE_VERSION; from += 1) {
    const step = MIGRATIONS[from];
    if (!step) return null;

    save = step(save);
  }

  return isUserSave(save) ? save : null;
};

export type { MigrationStep };
