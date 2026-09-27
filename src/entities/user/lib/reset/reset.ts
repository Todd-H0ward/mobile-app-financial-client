import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';

// ═══════════════════════════════════════════
// RESET
// ═══════════════════════════════════════════

/** Reset to the starting state, 2.5.12. Demo mode prepares a run the same way. */
export const resetUser = (user: UserSave): UserSave =>
  createInitialUser({
    playerName: user.playerName,
    createdAt: user.createdAt,
    settings: user.settings,
    robot: { name: user.robot.name },
  });
