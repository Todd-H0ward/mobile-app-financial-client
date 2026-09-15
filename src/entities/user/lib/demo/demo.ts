import type { DemoTimeSource, TimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import type { BudgetPlan, UserSave } from '../../model/types';
import { acknowledgeSummary, finishPeriod, startPeriod } from '../period';
import { resetUser } from '../reset';

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
// TOGGLE
// ═══════════════════════════════════════════

/**
 * Toggle demo mode for the current user.
 *
 * **Enabling** (`isDemoMode` was `false` → `true`):
 * Replaces the profile with a fresh demo profile. The child's progress is lost
 * because the grown-up chose to run a demo; they will disable it when done.
 * The grown-up's sound and animation settings survive.
 *
 * **Disabling** (`isDemoMode` was `true` → `false`):
 * Returns a clean starting profile with `isDemoMode: false`. The demo profile
 * is discarded — there is no "previous profile" to restore, since enabling demo
 * mode already wiped it. The grown-up's settings survive.
 *
 * Both directions produce a profile in `phase: 'planning'`, `period.index: 1`.
 */
export const toggleDemoMode = (user: UserSave): UserSave => {
  const { settings } = user;

  if (!settings.isDemoMode) {
    // Turning demo on: hand out a demo profile with the same device settings.
    return createDemoProfile(settings);
  }

  // Turning demo off: reset to a standard starting profile.
  return resetUser({
    ...user,
    settings: { ...settings, isDemoMode: false },
  });
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
    default:
      // `settlement` never lands in the save: acknowledgeSummary jumps to planning.
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
