import { useLocalSearchParams, useRouter } from 'expo-router';

import { getCutsceneById, type StoryCutsceneId } from '@/entities/story';
import { markStorySeen, useUpdateUser, useUser } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isCutsceneId = (value: unknown): value is StoryCutsceneId =>
  value === 'intro' || value === 'finale';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Completing or skipping the comic persists the same stable story id. */
export const useStory = () => {
  const router = useRouter();
  const user = useUser();
  const updateUser = useUpdateUser();
  const { cutsceneId } = useLocalSearchParams<{ cutsceneId?: string }>();

  const id = isCutsceneId(cutsceneId) ? cutsceneId : null;
  const cutscene = id ? getCutsceneById(id) : undefined;

  const finish = () => {
    if (id && user) {
      updateUser((current) => markStorySeen(current, id));
    }
    router.dismissTo(STATIC_ROUTES.HOME);
  };

  return {
    cutscene,
    isKnownId: id != null,
    finish,
  };
};
