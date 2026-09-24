import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';

// ═══════════════════════════════════════════
// RESET
// ═══════════════════════════════════════════

/**
 * Reset to the starting state, 2.5.12. Demo mode prepares a run the same way.
 *
 * What survives a reset, and why:
 * - **the player name and the robot's name** — that is who the child is, not
 *   progress; making them name everything again to zero a balance is
 *   pointless;
 * - **the grown-up's settings** — the gate, sound, animations and demo mode
 *   were configured by the grown-up, and wiping a child's progress is no
 *   reason to turn those off.
 *
 * Everything else goes back to zero: wallet, savings, bought items, the
 * robot's stage, history and the period. Erasing the profile entirely is `deleteUser` in the store.
 */
export const resetUser = (user: UserSave): UserSave =>
  createInitialUser({
    playerName: user.playerName,
    createdAt: user.createdAt,
    settings: user.settings,
    robot: { name: user.robot.name },
  });
