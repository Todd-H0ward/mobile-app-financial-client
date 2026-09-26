import { listGoals } from '@/entities/goal';
import {
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
} from '@/entities/robot-dog';
import { nextTaskId } from '@/entities/task';

import { startingWallet } from '../../lib/wallet';
import type { UserSave } from '../types';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Save schema version. Bumped on every incompatible change. */
const USER_SAVE_VERSION = 16;

/** Player name before the introduction asks for one. */
const DEFAULT_PLAYER_NAME = '';

/** Robot name before the introduction asks for one. The child picks it, 2.5.2. */
const DEFAULT_ROBOT_NAME = '';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CreateUserInput {
  /** The child's in-game name, from the introduction. */
  playerName?: string;
  /** The robot from the introduction: its name, usually. */
  robot?: Partial<UserSave['robot']>;
  /** Epoch ms of creation, from `TimeSource.now()`. */
  createdAt?: number;
  /** Grown-up settings. A reset passes the previous ones back in, untouched. */
  settings?: UserSave['settings'];
}

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/**
 * The starting profile: first period in planning, the starting wallet, goals
 * from content at zero progress.
 *
 * The same value is the result of a reset (2.5.12) and the base of the demo
 * profile (2.5.13), so the factory is pure: no `Date.now()`, no store reads.
 */
export const createInitialUser = ({
  playerName = DEFAULT_PLAYER_NAME,
  robot,
  createdAt = 0,
  settings,
}: CreateUserInput = {}): UserSave => ({
  version: USER_SAVE_VERSION,
  arcade: {
    sequence: 0,
    active: null,
    paidDay: -1,
    paidWeek: -1,
    paidCount: 0,
    scores: { snake: [], spacewarMs: [] },
  },
  completedLessonCells: [],
  completedLessonIds: [],
  /**
   * Cutscene ids the child has finished or skipped (`intro`, `finale`).
   * Empty on a fresh profile — setup then plays the walk/fall stub.
   */
  seenStoryIds: [],
  platform: { level: 0, receipts: [] },
  playerName,
  createdAt,
  robot: {
    name: DEFAULT_ROBOT_NAME,
    stage: 'basic',
    assembly: { head: 0, body: 0, legs: 0 },
    charge: 1,
    spirit: 1,
    ...robot,
  },
  // Credited, not materialized: the starting balance is named income too —
  // 2.5.4 makes no exception for the very first coin.
  wallet: startingWallet(createdAt),
  savings: {
    // Goals come from the validated catalogue, never straight from the JSON:
    // a broken row must fail in tests, not end up inside a child's save.
    goals: listGoals().map((goal) => ({
      goalId: goal.id,
      saved: 0,
      reachedInPeriod: null,
    })),
    activeGoalId: listGoals()[0]?.id ?? null,
    depositsThisPeriod: 0,
  },
  tasks: {
    // First chore in catalogue order — every task is unlocked at once.
    activeTaskId: nextTaskId([]),
    completedThisPeriod: [],
  },
  period: {
    index: 1,
    phase: 'planning',
    plan: { needs: 0, wants: 0, savings: 0 },
    fact: { needs: 0, wants: 0, savings: 0 },
    phaseEnteredAt: createdAt,
  },
  history: [],
  ownedItemIds: [],
  modules: { owned: [], tier: 0 },
  settings: settings ?? {
    isParentGateEnabled: true,
    isSoundEnabled: true,
    isAnimationEnabled: true,
    isGlassEnabled: true,
    isCameraRigEnabled: false,
    isDemoMode: false,
    robotSkin: DEFAULT_ROBOT_DOG_SKIN,
    robotAction: DEFAULT_ROBOT_DOG_ACTION,
  },
});

export type { CreateUserInput };
export { USER_SAVE_VERSION };
