import { describe, expect, it } from 'vitest';

import { listLessons } from '../catalogue';

import {
  ARENA_CELL_COUNT,
  activeLessonIndexForCell,
  cellOrdinalForLessonIndex,
  completedCellKeysFromLessons,
  displayNumberForCell,
  lessonIndicesForCell,
  lessonsForCell,
} from './layout';

describe('lesson layout on the arena', () => {
  it('matches the FBX disc count', () => {
    expect(ARENA_CELL_COUNT).toBe(90);
  });

  it('puts each of the first ninety lessons on its own cell', () => {
    expect(listLessons().length).toBeGreaterThanOrEqual(ARENA_CELL_COUNT);
    for (let i = 0; i < ARENA_CELL_COUNT; i += 1) {
      expect(cellOrdinalForLessonIndex(i)).toBe(i);
      expect(lessonIndicesForCell(i)[0]).toBe(i);
    }
  });

  it('stacks further lessons onto the same discs without a scene rebuild', () => {
    const total = listLessons().length;
    if (total <= ARENA_CELL_COUNT) {
      // Content is exactly one layer today — the wrap rule still holds.
      expect(cellOrdinalForLessonIndex(ARENA_CELL_COUNT)).toBe(0);
      expect(lessonIndicesForCell(0)).toEqual([0]);
      return;
    }
    expect(cellOrdinalForLessonIndex(ARENA_CELL_COUNT)).toBe(0);
    expect(lessonIndicesForCell(0)[1]).toBe(ARENA_CELL_COUNT);
    expect(lessonsForCell(0).length).toBeGreaterThan(1);
  });

  it('advances the tile number when a layer is cleared', () => {
    const first = listLessons()[0];
    expect(displayNumberForCell(0, [])).toBe(1);
    if (!first) return;
    expect(activeLessonIndexForCell(0, [first.id])).toBe(
      listLessons().length > ARENA_CELL_COUNT ? ARENA_CELL_COUNT : null,
    );
    if (listLessons().length > ARENA_CELL_COUNT) {
      expect(displayNumberForCell(0, [first.id])).toBe(ARENA_CELL_COUNT + 1);
    }
  });

  it('marks a cell sunk only when every stacked lesson is done', () => {
    const ids = lessonIndicesForCell(0).map((i) => listLessons()[i]?.id ?? '');
    expect(completedCellKeysFromLessons([])).not.toContain('0-0-0');
    expect(completedCellKeysFromLessons(ids)).toContain('0-0-0');
  });
});
