import type { UserSave } from '../../model/types';

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Whether the pet grew since the last time the child saw it happen.
 *
 * `acknowledgeSummary` may raise `pet.stage` on any settlement — including a
 * demo run's five in a row — without anyone having shown the child yet.
 * `celebratedStage` is the mark that a scene was actually seen; a mismatch is
 * a scene still owed, from wherever the app happens to be.
 */
export const hasPendingGrowth = (user: UserSave): boolean =>
  user.pet.stage !== user.pet.celebratedStage;

/**
 * Marks the current stage as celebrated, once the growth scene was shown.
 *
 * Never lowers `stage` itself — that would undo `growPet`'s "never
 * backwards" rule (2.2) by the back door. Only `celebratedStage` catches up.
 */
export const celebrateStage = (user: UserSave): UserSave => ({
  ...user,
  pet: {
    ...user.pet,
    celebratedStage: user.pet.stage,
  },
});
