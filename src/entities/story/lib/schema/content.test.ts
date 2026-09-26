import { describe, expect, it } from 'vitest';

import {
  assertStoryContent,
  getCutsceneById,
  hasStoryAsset,
  listCutscenes,
} from '../..';

import STORY_CONTENT from '@/content/story.json';

// ═══════════════════════════════════════════
describe('story content', () => {
  it('accepts the shipped file', () => {
    expect(() => assertStoryContent(STORY_CONTENT)).not.toThrow();
  });

  it('lists intro and finale with beats', () => {
    const cutscenes = listCutscenes();
    expect(cutscenes.map((cutscene) => cutscene.id)).toEqual([
      'intro',
      'finale',
    ]);
    for (const cutscene of cutscenes) {
      expect(getCutsceneById(cutscene.id)?.id).toBe(cutscene.id);
      expect(cutscene.beats.length).toBeGreaterThan(0);
      expect(cutscene.asset.endsWith('.mp4')).toBe(true);
    }
  });

  it('reports that video assets are not wired yet', () => {
    expect(hasStoryAsset('intro')).toBe(false);
    expect(hasStoryAsset('finale')).toBe(false);
  });

  it('rejects a missing finale', () => {
    expect(() =>
      assertStoryContent({
        cutscenes: STORY_CONTENT.cutscenes.filter(
          (cutscene) => cutscene.id !== 'finale',
        ),
      }),
    ).toThrow(/finale/);
  });

  it('rejects a duplicate id', () => {
    expect(() =>
      assertStoryContent({
        cutscenes: [
          ...STORY_CONTENT.cutscenes,
          {
            id: 'intro',
            title: 'Дубль',
            asset: 'intro.mp4',
            beats: [{ id: 'x', caption: 'Нет.' }],
          },
        ],
      }),
    ).toThrow(/duplicate/);
  });
});
