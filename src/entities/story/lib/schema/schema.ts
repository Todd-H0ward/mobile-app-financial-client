import { isNonEmptyString, isRecord } from '@/shared/utils';

import type {
  StoryBeat,
  StoryCutscene,
  StoryCutsceneId,
  StoryFile,
} from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Intro (walk + fall) and finale (reunion) — the two booked slots. */
const REQUIRED_IDS: readonly StoryCutsceneId[] = ['intro', 'finale'];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isCutsceneId = (value: unknown): value is StoryCutsceneId =>
  value === 'intro' || value === 'finale';

const assertBeat = (beat: unknown, path: string): StoryBeat => {
  if (!isRecord(beat)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(beat.id)) {
    throw new Error(`${path}.id: non-empty string required`);
  }
  if (!isNonEmptyString(beat.caption)) {
    throw new Error(`${path}.caption: non-empty string required`);
  }

  return { id: beat.id, caption: beat.caption };
};

const assertCutscene = (raw: unknown, path: string): StoryCutscene => {
  if (!isRecord(raw)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isCutsceneId(raw.id)) {
    throw new Error(`${path}.id: must be "intro" or "finale"`);
  }
  if (!isNonEmptyString(raw.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (!isNonEmptyString(raw.asset)) {
    throw new Error(`${path}.asset: non-empty string required`);
  }
  if (!Array.isArray(raw.beats) || raw.beats.length === 0) {
    throw new Error(`${path}.beats: non-empty array required`);
  }

  const beatIds = new Set<string>();
  const beats = raw.beats.map((beat, index) => {
    const parsed = assertBeat(beat, `${path}.beats[${index}]`);
    if (beatIds.has(parsed.id)) {
      throw new Error(`${path}: duplicate beat id "${parsed.id}"`);
    }
    beatIds.add(parsed.id);
    return parsed;
  });

  return {
    id: raw.id,
    title: raw.title,
    asset: raw.asset,
    beats,
  };
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/story.json`.
 *
 * A broken cutscene must fail in tests, not open an empty story screen on
 * the device. Both intro and finale have to be present — the entry and the
 * lift routes key off those ids.
 */
export const assertStoryContent = (data: unknown): StoryFile => {
  if (!isRecord(data)) {
    throw new Error('story content: must be an object');
  }
  if (!Array.isArray(data.cutscenes)) {
    throw new Error('story content: "cutscenes" must be an array');
  }

  const ids = new Set<string>();
  const cutscenes = data.cutscenes.map((cutscene, index) => {
    const parsed = assertCutscene(cutscene, `cutscenes[${index}]`);
    if (ids.has(parsed.id)) {
      throw new Error(`story: duplicate id "${parsed.id}"`);
    }
    ids.add(parsed.id);
    return parsed;
  });

  for (const id of REQUIRED_IDS) {
    if (!ids.has(id)) {
      throw new Error(`story content: missing required cutscene "${id}"`);
    }
  }

  return { cutscenes };
};
