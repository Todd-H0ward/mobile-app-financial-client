import type { BudgetPlan } from '@/entities/budget';
import {
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
} from '@/entities/robot-dog';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';
import { endPeriod, finishPeriod, startPeriod } from '../period';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Player name shown during a demo run. Not a real child's name. */
const DEMO_PLAYER_NAME = 'Демо';

/** Pet name used in the demo profile. */
const DEMO_PET_NAME = 'Лапик';

/**
 * Plan the demo run fills in for the child. All three directions are occupied
 * so `startPeriod` accepts it.
 */
const DEMO_PLAN: BudgetPlan = { needs: 20, wants: 10, savings: 10 };

/** How many periods one button press advances — 2.5.13 requires five. */
export const DEMO_RUN_PERIODS = 5;

/**
 * Hard cap on state-machine steps inside one run. Three transitions per period
 * plus a few to leave a mid-period phase; anything above means a bug.
 */
const DEMO_RUN_STEP_LIMIT = DEMO_RUN_PERIODS * 3 + 6;

// ═══════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════

/**
 * A pre-filled starting profile for demo mode (2.5.13).
 *
 * Demo is a test profile + reset — no accelerated clock, no formula fork (0.3-R).
 */
export const createDemoProfile = (
  settings?: Partial<UserSave['settings']>,
): UserSave =>
  createInitialUser({
    playerName: DEMO_PLAYER_NAME,
    createdAt: 0,
    pet: { name: DEMO_PET_NAME },
    settings: {
      isParentGateEnabled: true,
      isSoundEnabled: settings?.isSoundEnabled ?? true,
      isAnimationEnabled: settings?.isAnimationEnabled ?? true,
      isDemoMode: true,
      petSkin: settings?.petSkin ?? DEFAULT_ROBOT_DOG_SKIN,
      petAction: settings?.petAction ?? DEFAULT_ROBOT_DOG_ACTION,
    },
  });

// ═══════════════════════════════════════════
// ENTER / EXIT
// ═══════════════════════════════════════════

const carryDeviceSettings = (
  from: UserSave['settings'],
  isDemoMode: boolean,
): UserSave['settings'] => ({
  isParentGateEnabled: from.isParentGateEnabled,
  isSoundEnabled: from.isSoundEnabled,
  isAnimationEnabled: from.isAnimationEnabled,
  isDemoMode,
  // The coat is the child's, not the profile's: a demo run should not undress
  // the dog they picked, and leaving demo should not undo a coat picked in it.
  petSkin: from.petSkin,
  petAction: from.petAction,
});

export const enterDemoMode = (
  user: UserSave,
): { profile: UserSave; parked: UserSave } => ({
  profile: createDemoProfile(user.settings),
  parked: user,
});

export const exitDemoMode = (
  parked: UserSave | null,
  demo: UserSave,
): UserSave => {
  const settings = carryDeviceSettings(demo.settings, false);

  return parked
    ? { ...parked, settings }
    : createInitialUser({ settings, createdAt: demo.createdAt });
};

// ═══════════════════════════════════════════
// RUN PERIODS
// ═══════════════════════════════════════════

/**
 * One FSM step. Local `at` only labels history — economy ignores the clock.
 */
const stepDemoPeriod = (user: UserSave, at: number): UserSave => {
  switch (user.period.phase) {
    case 'planning':
      return startPeriod(
        {
          ...user,
          period: { ...user.period, plan: DEMO_PLAN },
        },
        at,
      );
    case 'active':
      return finishPeriod(user, at);
    case 'summary':
      return endPeriod(user, at);
  }
};

/**
 * Advance by `count` finished periods without waiting for real time (0.3-R).
 *
 * No DemoTimeSource: stamps are a local counter so history stays ordered.
 */
export const runDemoPeriods = (
  user: UserSave,
  count = DEMO_RUN_PERIODS,
): UserSave => {
  const targetIndex = user.period.index + count;
  let next = user;
  let steps = 0;
  let at = user.period.phaseEnteredAt;

  while (next.period.index < targetIndex) {
    if (steps >= DEMO_RUN_STEP_LIMIT) {
      throw new Error(
        `runDemoPeriods: exceeded ${DEMO_RUN_STEP_LIMIT} steps without reaching period ${targetIndex}`,
      );
    }

    at += 1;
    next = stepDemoPeriod(next, at);
    steps += 1;
  }

  return next;
};
