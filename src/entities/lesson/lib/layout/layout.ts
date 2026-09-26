import {
  SCENE_CELLS_PER_STEP,
  SCENE_SEGMENT_COUNT,
  SCENE_TERRACE_COUNT,
} from '@/entities/scene';

import type { Lesson } from '../../model';
import { listLessons } from '../catalogue';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Discs in the FBX — three bays × five terraces × six cells.
 *
 * Geometry is fixed; content is not. Extra rows in `lessons.json` stack as
 * further layers on the same discs (requirement 2.5.14 / 3.2: add lessons
 * in one file, no scene rebuild).
 */
const ARENA_CELL_COUNT =
  SCENE_SEGMENT_COUNT * SCENE_TERRACE_COUNT * SCENE_CELLS_PER_STEP;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Which arena disc hosts lesson index `i` (wraps onto the 90 tiles). */
const cellOrdinalForLessonIndex = (index: number): number => {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError('Lesson index must be a non-negative integer');
  }
  return index % ARENA_CELL_COUNT;
};

/**
 * Lesson indices on one cell, in play order — layer 0, then 1, …
 *
 * Cell `c` owns `c`, `c + 90`, `c + 180`, … while content lasts.
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
  for (let cell = 0; cell < ARENA_CELL_COUNT; cell += 1) {
    if (activeLessonIndexForCell(cell, completedLessonIds) === null) {
      const sector = Math.floor(cell / 30);
      const level = Math.floor((cell % 30) / 6);
      const index = cell % 6;
      keys.push(`${sector}-${level}-${index}`);
    }
  }
  return keys;
};

export {
  ARENA_CELL_COUNT,
  activeLessonIndexForCell,
  cellOrdinalForLessonIndex,
  completedCellKeysFromLessons,
  displayNumberForCell,
  lessonIndicesForCell,
  lessonsForCell,
};
