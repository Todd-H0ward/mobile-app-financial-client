import {
  type ArenaLayout,
  arenaLayoutOf,
  cellKey,
  layoutCell,
  SCENE_SEGMENT_COUNT,
  SCENE_TERRACE_COUNT,
} from '@/entities/scene';

import type { Lesson } from '../../model';
import { listLessons } from '../catalogue';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LessonPlacement {
  /** The arena cut into the rows the lessons ask for. */
  layout: ArenaLayout;
  /** `lessonOf[ordinal]` — which lesson (index in the file) a cell hosts. */
  lessonOf: number[];
  /** `ordinalOf[index]` — which cell a lesson (index in the file) sits on. */
  ordinalOf: number[];
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Where every lesson goes, read off the lessons themselves. */
const placeLessons = (lessons: readonly Lesson[]): LessonPlacement => {
  const counts = Array.from({ length: SCENE_SEGMENT_COUNT }, () =>
    Array.from({ length: SCENE_TERRACE_COUNT }, () => 0),
  );
  /** Each lesson's position in its row, in file order. */
  const positions = lessons.map((lesson) => {
    const row = counts[lesson.sector];
    if (!row) return -1;
    const position = row[lesson.level] ?? 0;
    row[lesson.level] = position + 1;
    return position;
  });

  const layout = arenaLayoutOf(counts);
  const lessonOf: number[] = [];
  const ordinalOf = lessons.map((lesson, index) => {
    const start = layout.starts[lesson.sector]?.[lesson.level];
    const position = positions[index] ?? -1;
    if (start === undefined || position < 0) return -1;
    lessonOf[start + position] = index;
    return start + position;
  });

  return { layout, lessonOf, ordinalOf };
};

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Where the lessons that ship are placed. */
const PLACEMENT = placeLessons(listLessons());

/** The arena as the content cuts it — the one layout the game uses. */
const ARENA_LAYOUT = PLACEMENT.layout;

/** Cells on the arena — one per lesson. */
const ARENA_CELL_COUNT = ARENA_LAYOUT.count;

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/** Which arena cell hosts lesson index `i` (its index in `lessons.json`). */
const cellOrdinalForLessonIndex = (index: number): number => {
  const ordinal = PLACEMENT.ordinalOf[index];
  if (!Number.isInteger(index) || ordinal === undefined || ordinal < 0) {
    throw new RangeError(`No cell for lesson index ${index}`);
  }
  return ordinal;
};

const assertOrdinal = (cellOrdinal: number) => {
  if (
    !Number.isInteger(cellOrdinal) ||
    cellOrdinal < 0 ||
    cellOrdinal >= ARENA_CELL_COUNT
  ) {
    throw new RangeError(
      `Cell ordinal must be 0…${ARENA_CELL_COUNT - 1}, got ${cellOrdinal}`,
    );
  }
};

/** Lesson indices on one cell, in play order. */
const lessonIndicesForCell = (cellOrdinal: number): number[] => {
  assertOrdinal(cellOrdinal);
  const index = PLACEMENT.lessonOf[cellOrdinal];
  return index === undefined ? [] : [index];
};

const lessonsForCell = (cellOrdinal: number): readonly Lesson[] => {
  const lessons = listLessons();
  return lessonIndicesForCell(cellOrdinal).map((index) => lessons[index]);
};

/** First unfinished lesson index on the cell, or `null` when it is done. */
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

/** `1`-based number drawn on the tile: its place in the arena. */
const displayNumberForCell = (
  cellOrdinal: number,
  _completedLessonIds: readonly string[] = [],
): number => cellOrdinal + 1;

/** Cell keys whose lesson is done — what the scene sinks. */
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

export type { LessonPlacement };
export {
  ARENA_CELL_COUNT,
  ARENA_LAYOUT,
  activeLessonIndexForCell,
  cellOrdinalForLessonIndex,
  completedCellKeysFromLessons,
  displayNumberForCell,
  lessonIndicesForCell,
  lessonsForCell,
  placeLessons,
};
