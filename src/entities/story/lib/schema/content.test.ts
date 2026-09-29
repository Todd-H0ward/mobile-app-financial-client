import { describe, expect, it } from 'vitest';

import { assertStoryContent, getCutsceneById, listCutscenes } from '../..';

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
    }
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
            beats: [{ id: 'x', caption: 'Нет.' }],
          },
        ],
      }),
    ).toThrow(/duplicate/);
  });
});

it('ships every comic frame and appearance as a real local image', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  const { resolve, dirname } = await import('node:path');
  const catalogue = resolve('src/entities/story/ui/story-images.ts');
  const source = readFileSync(catalogue, 'utf8');
  const assets = [...source.matchAll(/require\('([^']+)'\)/g)].map(
    (match) => match[1],
  );
  expect(assets).toHaveLength(8 * 7 * 3 * 3);
  for (const asset of assets)
    expect(existsSync(resolve(dirname(catalogue), asset))).toBe(true);
  for (const scene of listCutscenes()) {
    for (const beat of scene.beats) expect(source).toContain(`${beat.id}: {`);
  }
});
