import { listCatalogue } from '@/entities/catalogue';
import { getGoalById } from '@/entities/goal';
import {
  DEFAULT_ROBOT_DOG_ACTION,
  DEFAULT_ROBOT_DOG_SKIN,
} from '@/entities/robot-dog';
import { listTasks } from '@/entities/task';

import type { TimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';
import { endPeriod, finishPeriod, startPeriod } from '../period';
import { applyPurchase } from '../purchase';
import { applyDeposit, setActiveGoal } from '../savings';
import { applyCompleteTask } from '../tasks';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Player name shown during a demo run. Not a real child's name. */
const DEMO_PLAYER_NAME = 'Демо';

/** Robot name used in the demo profile. */
const DEMO_ROBOT_NAME = 'Болт';

/** One affordable purchase of each kind, using the shipped catalogue prices. */
const DEMO_BASKET = ['need', 'want'].map((kind) => {
  const item = [...listCatalogue()]
    .filter((entry) => entry.kind === kind)
    .sort((a, b) => a.price - b.price)[0];
  if (!item) throw new Error(`Demo requires a ${kind} item`);
  return item;
});

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
    robot: { name: DEMO_ROBOT_NAME },
    settings: {
      isParentGateEnabled: true,
      isSoundEnabled: settings?.isSoundEnabled ?? true,
      isAnimationEnabled: settings?.isAnimationEnabled ?? true,
      isCameraRigEnabled: settings?.isCameraRigEnabled ?? false,
      isDemoMode: true,
      robotSkin: settings?.robotSkin ?? DEFAULT_ROBOT_DOG_SKIN,
      robotAction: settings?.robotAction ?? DEFAULT_ROBOT_DOG_ACTION,
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
  isCameraRigEnabled: from.isCameraRigEnabled,
  isDemoMode,
  // The coat is the child's, not the profile's: a demo run should not undress
  // the dog they picked, and leaving demo should not undo a coat picked in it.
  robotSkin: from.robotSkin,
  robotAction: from.robotAction,
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

/** Executes the same earn, purchase and deposit operations as the screens. */
const playDemoPeriod = (user: UserSave, time: TimeSource): UserSave => {
  let next = user;
  for (const task of listTasks()) {
    const result = applyCompleteTask(next, task.id, time);
    if (result.ok) next = result.user;
  }
  for (const item of DEMO_BASKET) {
    const direction = item.kind === 'need' ? 'needs' : 'wants';
    if (next.period.fact[direction] > 0) continue;
    const result = applyPurchase(next, item.id, time);
    if (result.ok) next = result.user;
  }
  let remaining = Math.min(
    next.wallet.balance,
    Math.max(0, next.period.plan.savings - next.period.fact.savings),
  );
  for (const row of next.savings.goals) {
    const goal = getGoalById(row.goalId);
    if (!goal || remaining <= 0) continue;
    const amount = Math.min(remaining, goal.price - row.saved);
    if (amount <= 0) continue;
    const selected = setActiveGoal(next, goal.id);
    if (!selected.ok) continue;
    const result = applyDeposit(selected.user, goal.id, amount, time);
    if (result.ok) {
      next = result.user;
      remaining -= amount;
    }
  }
  return next;
};

const stepDemoPeriod = (user: UserSave, time: TimeSource): UserSave => {
  switch (user.period.phase) {
    case 'planning': {
      const needs = Math.min(user.wallet.balance, DEMO_BASKET[0].price);
      const wants = Math.min(user.wallet.balance - needs, DEMO_BASKET[1].price);
      const savings = user.wallet.balance - needs - wants;
      return startPeriod(
        {
          ...user,
          period: { ...user.period, plan: { needs, wants, savings } },
        },
        time.now(),
      );
    }
    case 'active':
      return finishPeriod(playDemoPeriod(user, time), time.now());
    case 'summary':
      return endPeriod(user, time.now());
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
  if (!user.settings.isDemoMode)
    throw new Error('runDemoPeriods: demo profile required');
  if (!Number.isInteger(count) || count < 0 || count > DEMO_RUN_PERIODS) {
    throw new Error('runDemoPeriods: count must be an integer from 0 to 5');
  }
  const targetIndex = user.period.index + count;
  let next = user;
  let steps = 0;
  let at = Math.max(
    user.period.phaseEnteredAt,
    ...user.wallet.history.map((entry) => entry.at),
  );
  const time: TimeSource = { now: () => ++at };

  while (next.period.index < targetIndex) {
    if (steps >= DEMO_RUN_STEP_LIMIT) {
      throw new Error(
        `runDemoPeriods: exceeded ${DEMO_RUN_STEP_LIMIT} steps without reaching period ${targetIndex}`,
      );
    }

    next = stepDemoPeriod(next, time);
    steps += 1;
  }

  return next;
};
