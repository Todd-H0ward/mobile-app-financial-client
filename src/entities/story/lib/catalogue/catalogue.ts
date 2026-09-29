import type { StoryCutscene } from '../../model';
import { assertStoryContent } from '../schema';

import STORY_CONTENT from '@/content/story.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const CUTSCENES = assertStoryContent(STORY_CONTENT).cutscenes;

export const listCutscenes = (): readonly StoryCutscene[] => CUTSCENES;

export const getCutsceneById = (id: string): StoryCutscene | undefined =>
  CUTSCENES.find((cutscene) => cutscene.id === id);
