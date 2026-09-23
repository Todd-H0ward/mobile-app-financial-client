import {
  PET_COLORS,
  PET_PATTERNS,
  PET_SPECIES,
  PET_STAGES,
} from '@/entities/pet';
import {
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
  isRobotDogAction,
  isRobotDogSkin,
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
};

// ═══════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════

const isBudget = (value: unknown): boolean =>
  isRecord(value) &&
  isFiniteNumber(value.needs) &&
  isFiniteNumber(value.wants) &&
  isFiniteNumber(value.savings);

const isPet = (value: unknown): boolean =>
  isRecord(value) &&
  isOneOf(value.species, PET_SPECIES) &&
  isOneOf(value.color, PET_COLORS) &&
  isOneOf(value.pattern, PET_PATTERNS) &&
  typeof value.name === 'string' &&
  Array.isArray(value.traitIds) &&
  value.traitIds.every((id) => typeof id === 'string') &&
  isOneOf(value.stage, PET_STAGES) &&
  isOneOf(value.celebratedStage, PET_STAGES) &&
  isFiniteNumber(value.comfort) &&
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

const isHome = (value: unknown): boolean =>
  isRecord(value) &&
  isFiniteNumber(value.temperature) &&
  Array.isArray(value.insulationIds) &&
  Array.isArray(value.furnitureIds) &&
  isFiniteNumber(value.lastBilledPeriod);

const isSettings = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.isParentGateEnabled === 'boolean' &&
  typeof value.isSoundEnabled === 'boolean' &&
  typeof value.isAnimationEnabled === 'boolean' &&
  typeof value.isDemoMode === 'boolean' &&
  isRobotDogSkin(value.petSkin) &&
  isRobotDogAction(value.petAction);

const isTasks = (value: unknown): boolean =>
  isRecord(value) &&
  (value.activeTaskId === null || typeof value.activeTaskId === 'string') &&
  Array.isArray(value.completedThisPeriod) &&
  value.completedThisPeriod.every((id) => typeof id === 'string');

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
  isPet(value.pet) &&
  isWallet(value.wallet) &&
  isSavings(value.savings) &&
  isTasks(value.tasks) &&
  isPeriod(value.period) &&
  Array.isArray(value.history) &&
  isHome(value.home) &&
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
