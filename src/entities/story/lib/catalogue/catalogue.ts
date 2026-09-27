import type { StoryCutscene, StoryCutsceneId } from '../../model';
import { assertStoryContent } from '../schema';

import STORY_CONTENT from '@/content/story.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const CUTSCENES = assertStoryContent(STORY_CONTENT).cutscenes;

/** Metro module ids for the mp4s under `assets/story/`. */
const ASSET_MODULES: Record<StoryCutsceneId, number | null> = {
  intro: null,
  finale: null,
};

export const listCutscenes = (): readonly StoryCutscene[] => CUTSCENES;

export const getCutsceneById = (id: string): StoryCutscene | undefined =>
  CUTSCENES.find((cutscene) => cutscene.id === id);

/** True once `ASSET_MODULES` points at a real `require('./….mp4')`. */
export const hasStoryAsset = (id: StoryCutsceneId): boolean =>
  ASSET_MODULES[id] != null;

/**
 * Metro asset module for the player, or `null` while the placeholder runs. Callers must
 * not pass this to a Video component until non-null.
 */
export const storyAssetModule = (id: StoryCutsceneId): number | null =>
  ASSET_MODULES[id];
