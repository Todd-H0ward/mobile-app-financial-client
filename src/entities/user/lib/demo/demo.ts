import type { UserSave } from '../../model';
import { createInitialUser } from '../../model';
import { resetUser } from '../reset';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Player name shown during a demo run. Not a real child's name. */
const DEMO_PLAYER_NAME = 'Демо';

/** Pet name used in the demo profile. */
const DEMO_PET_NAME = 'Лапик';

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
