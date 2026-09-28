import { MODULE_IDS } from '@/entities/catalogue';
import { PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import {
  isRobotAssembly,
  isRobotDogAction,
  isRobotDogSkin,
  ROBOT_DOG_STAGES,
} from '@/entities/robot-dog';

import { isFiniteNumber, isOneOf, isRecord } from '@/shared/utils';

import { USER_SAVE_VERSION } from '../initial-user';
import { PERIOD_PHASES, type UserSave } from '../types';

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
  typeof value.isTextureEnabled === 'boolean' &&
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
