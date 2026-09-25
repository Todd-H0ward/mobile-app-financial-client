import type { StoryCutsceneId } from '@/entities/story';

import type { UserSave } from '../../model';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Whether this profile has already finished (or skipped) the cutscene. */
export const hasSeenStory = (user: UserSave, id: StoryCutsceneId): boolean =>
  user.seenStoryIds.includes(id);

/**
 * Records that the child finished or skipped a cutscene.
 *
 * Idempotent — replaying from a debug menu must not grow the array twice.
 */
export const markStorySeen = (
  user: UserSave,
  id: StoryCutsceneId,
): UserSave => {
  if (user.seenStoryIds.includes(id)) return user;
  return {
    ...user,
    seenStoryIds: [...user.seenStoryIds, id],
  };
};
