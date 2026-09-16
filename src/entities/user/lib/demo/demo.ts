import type { BudgetPlan } from '@/entities/budget';

import type { DemoTimeSource, TimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';
import { acknowledgeSummary, finishPeriod, startPeriod } from '../period';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Player name shown during a demo run. Not a real child's name. */
const DEMO_PLAYER_NAME = 'Демо';

/** Pet name used in the demo profile. */
const DEMO_PET_NAME = 'Лапик';

/**
 * Plan the demo run fills in for the child. All three directions are occupied
 * so `startPeriod` accepts it — fact stays zero until wallet / shop exist.
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
 * The demo profile is structurally identical to a real starting profile — same
 * initial balance, same period structure, same goals. What differs is:
 * - the player name and pet name use fixed demo values;
 * - `isDemoMode` is always `true`;
 * - grown-up settings passed in (sound, animations, gate) are preserved so the
 *   demonstrator's device configuration survives a demo reset.
 *
 * The profile is pure: no `Date.now()`, no store calls.
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
    },
  });

// ═══════════════════════════════════════════
// ENTER / EXIT
// ═══════════════════════════════════════════

/**
 * Device settings that belong to the grown-up, not to a profile: they were set
 * on this phone and must survive both entering and leaving a demo.
 */
const carryDeviceSettings = (
  from: UserSave['settings'],
  isDemoMode: boolean,
): UserSave['settings'] => ({
  isParentGateEnabled: from.isParentGateEnabled,
  isSoundEnabled: from.isSoundEnabled,
  isAnimationEnabled: from.isAnimationEnabled,
  isDemoMode,
});

/**
 * Entering demo mode (2.5.13): the child's save is handed back to the caller to
 * park, and a fresh demo profile takes its place.
 *
 * Nothing is wiped. The grown-up demonstrating the app on a child's phone gets
 * their progress back untouched when they switch demo mode off — which is what
 * "сброс к исходному" means for a profile that already existed.
 *
 * @returns the demo profile to play, and the save to park until demo mode ends.
 */
export const enterDemoMode = (
  user: UserSave,
): { profile: UserSave; parked: UserSave } => ({
  profile: createDemoProfile(user.settings),
  parked: user,
});

/**
 * Leaving demo mode (2.5.13).
 *
 * The parked save comes back exactly as it was, wearing whatever device
 * settings the grown-up left on during the demo. Without a parked save — demo
 * mode was entered before this build, or the save did not survive — a clean
 * starting profile is returned rather than the demo's: the child must never end
 * up carrying the demo's name and pet.
 *
 * @param parked the save put aside by `enterDemoMode`, if there is one
 * @param demo the demo profile being left, the source of the device settings
 */
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
 * One transition of the period machine, filling `DEMO_PLAN` when needed.
 *
 * Fact is left at zero on purpose: wallet, tasks and shop are not wired yet,
 * and inventing spend would misrepresent the engine on a demo.
 */
const stepDemoPeriod = (user: UserSave, time: TimeSource): UserSave => {
  // Every phase is named: `PeriodPhase` has exactly these three, so adding a
  // fourth makes this switch fail to compile instead of falling through.
  switch (user.period.phase) {
    case 'planning':
      return startPeriod(
        {
          ...user,
          period: { ...user.period, plan: DEMO_PLAN },
        },
        time,
      );
    case 'active':
      return finishPeriod(user, time);
    case 'summary':
      return acknowledgeSummary(user, time);
  }
};

/**
 * Advance the period machine by `count` finished periods without waiting for
 * real time. Starts from any phase (the grown-up may press mid-period).
 *
 * After each transition `time.tick()` runs so `phaseEnteredAt` / `endedAt`
 * stay strictly ascending in history.
 */
export const runDemoPeriods = (
  user: UserSave,
  time: DemoTimeSource,
  count = DEMO_RUN_PERIODS,
): UserSave => {
  const targetIndex = user.period.index + count;
  let next = user;
  let steps = 0;

  while (next.period.index < targetIndex) {
    if (steps >= DEMO_RUN_STEP_LIMIT) {
      throw new Error(
        `runDemoPeriods: exceeded ${DEMO_RUN_STEP_LIMIT} steps without reaching period ${targetIndex}`,
      );
    }

    next = stepDemoPeriod(next, time);
    time.tick();
    steps += 1;
  }

  return next;
};
