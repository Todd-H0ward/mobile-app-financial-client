import { describe, expect, it } from 'vitest';

import { completedCellKeysFromLessons, listLessons } from '@/entities/lesson';

import { createInitialUser } from '../../model/initial-user';

import { importLegacyProgress, isCompletedCellKey } from './legacy-progress';

describe('legacy progress import', () => {
  it('preserves real cells and discards duplicates, corrupt keys and out-of-arena coordinates', () => {
    const result = importLegacyProgress(
      createInitialUser(),
      { doneCells: ['0-0-0', '2-4-5', '0-0-0', '3-0-0', '0-5-0', '0-0-6', 1] },
      null,
    );
    // Old-grid keys are read as the lessons they stood for — `0-4-5` is the
    // thirtieth — and the cells are those lessons' cells on today's arena.
    const ids = [listLessons()[0]?.id, listLessons()[29]?.id];
    expect(result.completedLessonIds).toEqual(ids);
    expect(result.completedLessonCells).toEqual(
      completedCellKeysFromLessons(ids.filter((id) => id !== undefined)),
    );
  });
  it('normalizes legacy records without importing invalid or unbounded data', () => {
    const result = importLegacyProgress(createInitialUser(), null, {
      snake: [1, -1, 9, 7, 8, 2, 4, 0.5, null],
      spacewarMs: [7000, 4000, 0, '3000'],
    });
    expect(result.arcade.scores).toEqual({
      snake: [9, 8, 7, 4, 2],
      spacewarMs: [4000, 7000],
    });
  });
  it('accepts exactly ninety canonical keys', () => {
    const keys = [];
    for (let sector = 0; sector < 4; sector++)
      for (let level = 0; level < 6; level++)
        for (let cell = 0; cell < 7; cell++) {
          const key = `${sector}-${level}-${cell}`;
          if (isCompletedCellKey(key)) keys.push(key);
        }
    expect(keys).toHaveLength(90);
    expect(isCompletedCellKey('00-0-0')).toBe(false);
  });
});
