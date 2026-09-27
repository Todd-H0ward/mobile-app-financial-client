import { MODULE_IDS } from '@/entities/catalogue';
import { PLATFORM_GOAL_ID, PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import { listGoals } from '@/entities/goal';
import { completedCellKeysFromLessons, listLessons } from '@/entities/lesson';
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

/** One step at a time: the key is the version coming in, the value is how to get to the next one. */
const MIGRATIONS: Record<number, MigrationStep> = {
  // Pit goals replace the old coat / radar / beacon catalogue.
  18: (save) => {
    const GOAL_REMAP: Record<string, string> = {
      coat: 'coat',
      radar: 'radar',
      beacon: 'beacon',
    };
    const TASK_REMAP: Record<string, string> = {
      'save-for-radar': 'save-for-radar',
    };
    const remapId = (id: string, table: Record<string, string>) =>
      table[id] ?? id;

    const savings = isRecord(save.savings) ? save.savings : {};
    const rawGoals = Array.isArray(savings.goals) ? savings.goals : [];
    const byId = new Map<
      string,
      { goalId: string; saved: number; reachedInPeriod: number | null }
    >();

    for (const row of rawGoals) {
      if (!isRecord(row) || typeof row.goalId !== 'string') continue;
      const goalId = remapId(row.goalId, GOAL_REMAP);
      const saved = isFiniteNumber(row.saved) ? Math.max(0, row.saved) : 0;
      const reachedInPeriod =
        row.reachedInPeriod === null || isFiniteNumber(row.reachedInPeriod)
          ? (row.reachedInPeriod as number | null)
          : null;
      const previous = byId.get(goalId);
      byId.set(goalId, {
        goalId,
        saved: Math.max(previous?.saved ?? 0, saved),
        reachedInPeriod: previous?.reachedInPeriod ?? reachedInPeriod,
      });
    }

    for (const goal of listGoals()) {
      if (!byId.has(goal.id)) {
        byId.set(goal.id, {
          goalId: goal.id,
          saved: 0,
          reachedInPeriod: null,
        });
      }
    }

    const catalogueIds = new Set(listGoals().map((goal) => goal.id));
    const goals = [...byId.values()].filter((row) =>
      catalogueIds.has(row.goalId),
    );

    const activeRaw =
      typeof savings.activeGoalId === 'string' ? savings.activeGoalId : null;
    const activeMapped = activeRaw ? remapId(activeRaw, GOAL_REMAP) : null;
    const activeGoalId =
      activeMapped && catalogueIds.has(activeMapped)
        ? activeMapped
        : catalogueIds.has(PLATFORM_GOAL_ID)
          ? PLATFORM_GOAL_ID
          : (goals[0]?.goalId ?? null);

    const tasks = isRecord(save.tasks) ? save.tasks : {};
    const completed = Array.isArray(tasks.completedThisPeriod)
      ? tasks.completedThisPeriod
      : [];
    const activeTaskId =
      typeof tasks.activeTaskId === 'string'
        ? remapId(tasks.activeTaskId, TASK_REMAP)
        : tasks.activeTaskId;

    return {
      ...save,
      version: 19,
      savings: {
        ...savings,
        goals,
        activeGoalId,
      },
      tasks: {
        ...tasks,
        activeTaskId,
        completedThisPeriod: completed.map((id) =>
          typeof id === 'string' ? remapId(id, TASK_REMAP) : id,
        ),
      },
    };
  },
  // The arena was re-cut: the platform ring holds no cells and the steps carry more than six
  // each, so a key like `0-0-0` names another cell now — or none.
  17: (save) => {
    const completedLessonIds = Array.isArray(save.completedLessonIds)
      ? save.completedLessonIds.filter(
          (id): id is string => typeof id === 'string',
        )
      : [];
    return {
      ...save,
      version: 18,
      completedLessonCells: completedCellKeysFromLessons(completedLessonIds),
    };
  },
  16: (save) => {
    const modules = isRecord(save.modules) ? save.modules : {};
    const owned = Array.isArray(modules.owned) ? modules.owned : [];
    // Previously every purchased module was active. Preserve those bonuses.
    return {
      ...save,
      version: 17,
      modules: {
        ...modules,
        installed: [
          ...new Set(
            owned.filter(
              (id) => typeof id === 'string' && MODULE_IDS.includes(id),
            ),
          ),
        ],
      },
    };
  },
  15: (save) => ({
    ...save,
    version: 16,
    settings: {
      ...(isRecord(save.settings) ? save.settings : {}),
      isGlassEnabled: true,
    },
  }),
  14: (save) => {
    // Named profiles already passed setup — do not force the intro stub on them.
    const robot = isRecord(save.robot) ? save.robot : {};
    const hasNames =
      typeof save.playerName === 'string' &&
      save.playerName.trim().length > 0 &&
      typeof robot.name === 'string' &&
      robot.name.trim().length > 0;
    return {
      ...save,
      version: 15,
      seenStoryIds: hasNames ? ['intro'] : [],
    };
  },
  13: (save) => ({
    ...save,
    version: 14,
    settings: {
      ...(isRecord(save.settings) ? save.settings : {}),
      isCameraRigEnabled: false,
    },
  }),
  12: (save) => {
    const cells = Array.isArray(save.completedLessonCells)
      ? save.completedLessonCells.filter(
          (key): key is string =>
            typeof key === 'string' && /^[0-2]-[0-4]-[0-5]$/.test(key),
        )
      : [];
    // Layer 0 only — extras in lessons.json were never reachable before.
    const completedLessonIds = cells
      .map((key) => {
        const [sector, level, index] = key.split('-').map(Number);
        const ordinal = sector * 30 + level * 6 + index;
        return listLessons()[ordinal]?.id;
      })
      .filter((id): id is string => typeof id === 'string');
    return {
      ...save,
      version: 13,
      completedLessonIds: [...new Set(completedLessonIds)],
    };
  },
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
  // The old arena repeated the first 30 lessons in every sector. Preserve that learned
  // content without marking new practice exercises completed.
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
  0: (save) => ({ ...createInitialUser(), ...save, version: 1 }),

  // v1 — the pet grew a `celebratedStage`.
  1: (save) => {
    const pet = isRecord(save.pet) ? save.pet : {};

    return {
      ...save,
      pet: { ...pet, celebratedStage: pet.stage ?? 'baby' },
      version: 2,
    };
  },

  // v2 — the wallet grew `entryCount`, the counter `WalletEntry.id` is built from.
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

  // v3 — chores engine: active task + per-period completions (2.5.8).
  3: (save) => {
    const fresh = createInitialUser();

    return {
      ...save,
      tasks: fresh.tasks,
      version: 4,
    };
  },

  // v4 — the pet became a 3D robot dog with seven coats and four clips.
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

  // v5 — the game left the pet's house for the pit. The 2D pet's species, coat, pattern and
  // traits go; its name, stage and mood carry over to the robot.
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
  typeof value.isGlassEnabled === 'boolean' &&
  typeof value.isCameraRigEnabled === 'boolean' &&
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
      [
        'puzzle',
        'snake',
        'spacewar',
        'market',
        'weekly',
        'conveyor',
        'scales',
        'cashier',
        'jar',
        'pinball',
        'memory',
        'path',
        'assemble',
        'laser',
        'orbit',
      ].includes(String(value.active.gameId))));

const isModules = (value: unknown): boolean =>
  isRecord(value) &&
  Array.isArray(value.owned) &&
  value.owned.every((id) => typeof id === 'string') &&
  Array.isArray(value.installed) &&
  new Set(value.installed).size === value.installed.length &&
  value.installed.every(
    (id) =>
      typeof id === 'string' &&
      MODULE_IDS.includes(id) &&
      (value.owned as unknown[]).includes(id),
  ) &&
  (value.tier === 0 ||
    value.tier === 1 ||
    value.tier === 2 ||
    value.tier === 3);

/** Checks the shape of the save, not its meaning: passing means no screen will crash reading a field. */
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
  // Shape only: which cells exist is the layout's business, and a save must not be thrown
  // away because the content grew a row.
  value.completedLessonCells.every(
    (key) => typeof key === 'string' && /^\d{1,2}-\d{1,2}-\d{1,2}$/.test(key),
  ) &&
  new Set(value.completedLessonCells).size ===
    value.completedLessonCells.length &&
  Array.isArray(value.completedLessonIds) &&
  value.completedLessonIds.every((id) => typeof id === 'string') &&
  new Set(value.completedLessonIds).size === value.completedLessonIds.length &&
  Array.isArray(value.seenStoryIds) &&
  value.seenStoryIds.every((id) => typeof id === 'string') &&
  new Set(value.seenStoryIds).size === value.seenStoryIds.length &&
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

/** Brings a save of any past version up to the current one. */
export const migrateUser = (
  persisted: unknown,
  version: number,
): UserSave | null => {
  if (!isRecord(persisted)) return null;
  // A save from the future means the app was rolled back. There is nothing to migrate
  // downwards, and guessing is worse than starting over.
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
