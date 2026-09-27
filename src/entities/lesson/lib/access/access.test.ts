import { describe, expect, it } from 'vitest';

import { cellKey, rowCells } from '@/entities/scene';

import { listLessons } from '../catalogue';
import { ARENA_LAYOUT, lessonIndicesForCell } from '../layout';

import { lessonAccess, lessonCellKey, lessonOrdinalForKey } from './access';

/** Base-layer lesson ids for the given cell keys — one layer of progress. */
const idsForKeys = (keys: readonly string[]): string[] =>
  keys.map((key) => {
    const ordinal = lessonOrdinalForKey(key);
    if (ordinal === null) throw new Error(`bad key ${key}`);
    return listLessons()[ordinal]?.id ?? '';
  });

/** Every stacked lesson on those cells — cell fully sunk. */
const allIdsForKeys = (keys: readonly string[]): string[] =>
  keys.flatMap((key) => {
    const ordinal = lessonOrdinalForKey(key);
    if (ordinal === null) throw new Error(`bad key ${key}`);
    return lessonIndicesForCell(ordinal).map(
      (index) => listLessons()[index]?.id ?? '',
    );
  });

/** Keys of every cell on one row — one step of one bay. */
const rowKeys = (segment: number, step: number): string[] =>
  rowCells(ARENA_LAYOUT, segment, step).map(cellKey);

describe('arena lesson access', () => {
  it('opens the first step of every bay from the floor, and nothing above it', () => {
    for (const segment of [0, 1, 2]) {
      const [first, ...rest] = rowKeys(segment, 1);
      const [above] = rowKeys(segment, 2);
      if (!first || !above) throw new Error('empty bay');
      expect(lessonAccess(lessonOrdinalForKey(first) ?? -1, [], 0).status).toBe(
        'CURRENT',
      );
      for (const key of rest) {
        expect(lessonAccess(lessonOrdinalForKey(key) ?? -1, [], 0).status).toBe(
          'AVAILABLE',
        );
      }
      expect(lessonAccess(lessonOrdinalForKey(above) ?? -1, [], 0).status).toBe(
        'LOCKED',
      );
    }
  });
  it('requires both the row below in the same bay and the paid lift', () => {
    const below = allIdsForKeys(rowKeys(0, 1));
    const next = lessonOrdinalForKey(rowKeys(0, 2)[0] ?? '') ?? -1;
    const otherBay = lessonOrdinalForKey(rowKeys(1, 2)[0] ?? '') ?? -1;
    expect(lessonAccess(next, below, 0).status).toBe('LOCKED');
    expect(
      lessonAccess(next, idsForKeys(rowKeys(0, 1).slice(1)), 1).status,
    ).toBe('LOCKED');
    expect(lessonAccess(next, below, 1).status).toBe('CURRENT');
    // Each bay climbs on its own.
    expect(lessonAccess(otherBay, below, 1).status).toBe('LOCKED');
  });
  it('keeps earned progress accessible and advances the suggested cell', () => {
    const [firstKey] = rowKeys(0, 1);
    if (!firstKey) throw new Error('no first row');
    expect(lessonAccess(0, allIdsForKeys([firstKey]), 0).status).toBe(
      'COMPLETED',
    );
    expect(lessonAccess(1, idsForKeys([firstKey]), 0).status).toBe('CURRENT');
  });
  it('maps every cell and rejects keys the arena does not have', () => {
    for (let n = 0; n < ARENA_LAYOUT.count; n++)
      expect(lessonOrdinalForKey(lessonCellKey(n))).toBe(n);
    for (const key of ['0-0-0', '3-1-0', '0-5-0', '0-1-99', 'NaN', ''])
      expect(lessonOrdinalForKey(key)).toBeNull();
  });
  it('ships a complete decision scenario, metadata and unlock rule for every lesson', () => {
    for (const [n, lesson] of listLessons().entries()) {
      if (n >= 90) break;
      expect(lesson.sector).toBe(Math.floor(n / 30));
      expect(lesson.level).toBe(Math.floor((n % 30) / 6));
      expect(lesson.learningObjective?.length).toBeGreaterThan(0);
      expect(lesson.scenario?.actions.length).toBeGreaterThanOrEqual(2);
      expect(
        lesson.scenario?.actions.every(
          (action) => action.title && action.consequence,
        ),
      ).toBe(true);
      expect(
        lesson.scenario?.actions.some((action) => action.isRecommended),
      ).toBe(true);
      expect(lesson.unlockCondition?.platformLevel).toBe(lesson.level);
      expect(lesson.reward?.coins).toBe(0);
    }
  });
});
