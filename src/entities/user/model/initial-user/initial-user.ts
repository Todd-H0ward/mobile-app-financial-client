import { STARTING_BALANCE } from '@/entities/economy';
import { listGoals } from '@/entities/goal';

import type { UserSave } from '../types';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Save schema version. Bumped on every incompatible change. */
const USER_SAVE_VERSION = 2;

/** Starting thermostat position: chilly, but not cold. */
const STARTING_TEMPERATURE = 0.5;

/** Player name before onboarding. Onboarding overwrites it first thing. */
const DEFAULT_PLAYER_NAME = '';

/** Pet name before onboarding. The child picks their own, 2.5.2. */
const DEFAULT_PET_NAME = '';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CreateUserInput {
  /** The child's in-game name, from onboarding. */
  playerName?: string;
  /** The pet from onboarding: species, coat, pattern, name. */
  pet?: Partial<UserSave['pet']>;
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
  pet,
  createdAt = 0,
  settings,
}: CreateUserInput = {}): UserSave => ({
  version: USER_SAVE_VERSION,
  playerName,
  createdAt,
  pet: {
    species: 'cat',
    color: 'sand',
    pattern: 'solid',
    name: DEFAULT_PET_NAME,
    traitIds: [],
    stage: 'baby',
    // A baby is where every pet starts, so nothing is owed on a fresh profile.
    celebratedStage: 'baby',
    comfort: 1,
    spirit: 1,
    ...pet,
  },
  wallet: {
    balance: STARTING_BALANCE,
    history: [],
  },
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
  period: {
    index: 1,
    phase: 'planning',
    plan: { needs: 0, wants: 0, savings: 0 },
    fact: { needs: 0, wants: 0, savings: 0 },
    phaseEnteredAt: createdAt,
  },
  history: [],
  home: {
    temperature: STARTING_TEMPERATURE,
    insulationIds: [],
    furnitureIds: [],
    lastBilledPeriod: 0,
  },
  settings: settings ?? {
    isParentGateEnabled: true,
    isSoundEnabled: true,
    isAnimationEnabled: true,
    isDemoMode: false,
  },
});

export type { CreateUserInput };
export { USER_SAVE_VERSION };
