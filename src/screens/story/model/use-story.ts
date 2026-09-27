import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  getCutsceneById,
  hasStoryAsset,
  type StoryCutsceneId,
} from '@/entities/story';
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

/** When real mp4s land, the same `finish` path stays — only the player changes */
export const useStory = () => {
  const router = useRouter();
  const user = useUser();
  const updateUser = useUpdateUser();
  const { cutsceneId } = useLocalSearchParams<{ cutsceneId?: string }>();

  const id = isCutsceneId(cutsceneId) ? cutsceneId : null;
  const cutscene = id ? getCutsceneById(id) : undefined;
  const isAssetReady = id ? hasStoryAsset(id) : false;

  const finish = () => {
    if (id && user) {
      updateUser((current) => markStorySeen(current, id));
    }
    router.dismissTo(STATIC_ROUTES.HOME);
  };

  return {
    cutscene,
    isAssetReady,
    isKnownId: id != null,
    finish,
  };
};
