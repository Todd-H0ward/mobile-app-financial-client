import { arenaLayout, cellKey, layoutCell } from '@/entities/scene';

import type { Lesson } from '../../model';
import { listLessons } from '../catalogue';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * How the arena is cut for the lessons that ship.
 *
 * The cells follow the content, not the other way round: ninety lessons fill
 * three bays × five terraces × six cells, and fewer leave each bay on a short
 * top row that the scene stretches over the whole arc (requirement 2.5.14 /
 * 3.2: add lessons in one file, no scene rebuild). Past ninety the arena is
 * full and further rows stack as layers on the same cells.
 */
const ARENA_LAYOUT = arenaLayout(listLessons().length);

/** Cells on the arena — one per lesson, up to ninety. */
const ARENA_CELL_COUNT = ARENA_LAYOUT.count;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Which arena cell hosts lesson index `i` (wraps onto the cells there are). */
const cellOrdinalForLessonIndex = (index: number): number => {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError('Lesson index must be a non-negative integer');
  }
  return ARENA_CELL_COUNT > 0 ? index % ARENA_CELL_COUNT : 0;
};

/**
 * Lesson indices on one cell, in play order — layer 0, then 1, …
 *
 * Cell `c` owns `c`, `c + count`, `c + 2 × count`, … while content lasts.
 */
const lessonIndicesForCell = (cellOrdinal: number): number[] => {
  if (
    !Number.isInteger(cellOrdinal) ||
    cellOrdinal < 0 ||
    cellOrdinal >= ARENA_CELL_COUNT
  ) {
    throw new RangeError(
      `Cell ordinal must be 0…${ARENA_CELL_COUNT - 1}, got ${cellOrdinal}`,
    );
  }
  const lessons = listLessons();
  const indices: number[] = [];
  for (let i = cellOrdinal; i < lessons.length; i += ARENA_CELL_COUNT) {
    indices.push(i);
  }
  return indices;
};

const lessonsForCell = (cellOrdinal: number): readonly Lesson[] => {
  const lessons = listLessons();
  return lessonIndicesForCell(cellOrdinal).map((index) => lessons[index]);
};

/**
 * First unfinished lesson index on the cell, or `null` when the stack is clear.
 */
const activeLessonIndexForCell = (
  cellOrdinal: number,
  completedLessonIds: readonly string[],
): number | null => {
  const lessons = listLessons();
  const done = new Set(completedLessonIds);
  for (const index of lessonIndicesForCell(cellOrdinal)) {
    const lesson = lessons[index];
    if (lesson && !done.has(lesson.id)) return index;
  }
  return null;
};

/** `1`-based number drawn on the tile — the active lesson, else the first. */
const displayNumberForCell = (
  cellOrdinal: number,
  completedLessonIds: readonly string[],
): number => {
  const active = activeLessonIndexForCell(cellOrdinal, completedLessonIds);
  if (active !== null) return active + 1;
  const indices = lessonIndicesForCell(cellOrdinal);
  const last = indices[indices.length - 1];
  return (last ?? cellOrdinal) + 1;
};

/** Cell keys whose every stacked lesson is done — what the scene sinks. */
const completedCellKeysFromLessons = (
  completedLessonIds: readonly string[],
): string[] => {
  const keys: string[] = [];
  for (let ordinal = 0; ordinal < ARENA_CELL_COUNT; ordinal += 1) {
    if (activeLessonIndexForCell(ordinal, completedLessonIds) !== null) {
      continue;
    }
    const cell = layoutCell(ARENA_LAYOUT, ordinal);
    if (cell) keys.push(cellKey(cell));
  }
  return keys;
};

export {
  ARENA_CELL_COUNT,
  ARENA_LAYOUT,
  activeLessonIndexForCell,
  cellOrdinalForLessonIndex,
  completedCellKeysFromLessons,
  displayNumberForCell,
  lessonIndicesForCell,
  lessonsForCell,
};
