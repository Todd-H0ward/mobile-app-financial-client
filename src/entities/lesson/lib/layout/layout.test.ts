import { describe, expect, it } from 'vitest';

import type { Lesson } from '../../model';
import { listLessons } from '../catalogue';

import {
  ARENA_CELL_COUNT,
  ARENA_LAYOUT,
  activeLessonIndexForCell,
  cellOrdinalForLessonIndex,
  completedCellKeysFromLessons,
  displayNumberForCell,
  lessonIndicesForCell,
  placeLessons,
} from './layout';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** The smallest lesson `placeLessons` can place — only the fields it reads. */
const at = (id: string, sector: number, level: number): Lesson => ({
  id,
  title: id,
  theory: [],
  questions: [],
  sector,
  level,
});

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('placeLessons', () => {
  it('builds each row from the lessons that name its theme and step', () => {
    const { layout } = placeLessons([
      at('a', 0, 1),
      at('b', 0, 1),
      at('c', 0, 2),
      at('d', 2, 1),
    ]);
    expect(layout.rows).toEqual([
      [0, 2, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
    ]);
    expect(layout.count).toBe(4);
  });

  it('numbers by theme, up its steps, in file order within a row', () => {
    // File order interleaves themes; the numbers do not.
    const { lessonOf, ordinalOf } = placeLessons([
      at('savings-1', 1, 1),
      at('basics-2', 0, 2),
      at('basics-1', 0, 1),
      at('basics-1b', 0, 1),
    ]);
    // Theme 0 first: its step 1 in file order, then its step 2; theme 1 last.
    expect(lessonOf).toEqual([2, 3, 1, 0]);
    expect(ordinalOf).toEqual([3, 2, 0, 1]);
  });

  it('gives a new lesson a cell of its own without touching other rows', () => {
    const base = [at('a', 0, 1), at('b', 1, 1)];
    const before = placeLessons(base).layout.rows;
    const after = placeLessons([...base, at('new', 0, 1)]).layout.rows;
    expect(after[0]?.[1]).toBe((before[0]?.[1] ?? 0) + 1);
    expect(after[1]).toEqual(before[1]);
  });
});

describe('the arena the content builds', () => {
  it('gives each of the ninety lessons a cell of its own', () => {
    expect(ARENA_CELL_COUNT).toBe(listLessons().length);
    const seen = new Set<number>();
    listLessons().forEach((_, index) => {
      const ordinal = cellOrdinalForLessonIndex(index);
      expect(lessonIndicesForCell(ordinal)).toEqual([index]);
      seen.add(ordinal);
    });
    expect(seen.size).toBe(ARENA_CELL_COUNT);
  });

  it('puts every lesson in the row its theme and step name', () => {
    listLessons().forEach((lesson, index) => {
      const ordinal = cellOrdinalForLessonIndex(index);
      const start = ARENA_LAYOUT.starts[lesson.sector]?.[lesson.level] ?? -1;
      const size = ARENA_LAYOUT.rows[lesson.sector]?.[lesson.level] ?? 0;
      expect(ordinal).toBeGreaterThanOrEqual(start);
      expect(ordinal).toBeLessThan(start + size);
    });
  });

  it('draws the cell ordinal as the number on the tile', () => {
    expect(displayNumberForCell(0)).toBe(1);
    expect(displayNumberForCell(ARENA_CELL_COUNT - 1)).toBe(ARENA_CELL_COUNT);
  });

  it('marks a cell done once its lesson is', () => {
    const [index] = lessonIndicesForCell(0);
    const id = listLessons()[index ?? 0]?.id ?? '';
    expect(activeLessonIndexForCell(0, [])).toBe(index);
    expect(activeLessonIndexForCell(0, [id])).toBeNull();
    // Ordinal 0 is the first cell of the first step of the first theme.
    expect(completedCellKeysFromLessons([])).not.toContain('0-1-0');
    expect(completedCellKeysFromLessons([id])).toEqual(['0-1-0']);
  });
});
