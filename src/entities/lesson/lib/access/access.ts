import {
  cellFromKey,
  cellKey,
  layoutCell,
  layoutOrdinal,
  rowCells,
  SCENE_FIRST_CELL_STEP,
} from '@/entities/scene';

import {
  ARENA_CELL_COUNT,
  ARENA_LAYOUT,
  activeLessonIndexForCell,
  completedCellKeysFromLessons,
} from '../layout';

type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'CURRENT' | 'COMPLETED';

/** The key of the cell at an ordinal, or `''` past the end of the arena. */
export const lessonCellKey = (ordinal: number): string => {
  const cell = layoutCell(ARENA_LAYOUT, ordinal);
  return cell ? cellKey(cell) : '';
};

export const lessonOrdinalForKey = (key: string): number | null => {
  const cell = cellFromKey(key, ARENA_LAYOUT);
  return cell ? layoutOrdinal(ARENA_LAYOUT, cell) : null;
};

export const lessonAccess = (
  cellOrdinal: number,
  completedLessonIds: readonly string[],
  platformLevel: number,
): { status: LessonStatus; requiredLevel: number; missing: number } => {
  const cell = layoutCell(ARENA_LAYOUT, cellOrdinal);
  if (!cell || cellOrdinal >= ARENA_CELL_COUNT) {
    return { status: 'LOCKED', requiredLevel: 0, missing: 0 };
  }

  // The first step is reachable from the floor; each one after needs a lift.
  const requiredLevel = Math.max(0, cell.step - SCENE_FIRST_CELL_STEP);

  const active = activeLessonIndexForCell(cellOrdinal, completedLessonIds);
  if (active === null) {
    return { status: 'COMPLETED', requiredLevel, missing: 0 };
  }

  const doneCells = new Set(completedCellKeysFromLessons(completedLessonIds));
  const preceding =
    cell.step > SCENE_FIRST_CELL_STEP
      ? rowCells(ARENA_LAYOUT, cell.segment, cell.step - 1).map(cellKey)
      : [];
  const missing = preceding.filter((key) => !doneCells.has(key)).length;
  if (platformLevel < requiredLevel || missing > 0) {
    return { status: 'LOCKED', requiredLevel, missing };
  }

  const first = rowCells(ARENA_LAYOUT, cell.segment, cell.step)
    .map((entry) => layoutOrdinal(ARENA_LAYOUT, entry))
    .find(
      (ordinal) =>
        ordinal !== null &&
        activeLessonIndexForCell(ordinal, completedLessonIds) !== null,
    );

  return {
    status: cellOrdinal === first ? 'CURRENT' : 'AVAILABLE',
    requiredLevel,
    missing: 0,
  };
};

/** Open tiles only — passed cells stay lit and ignore a hold. */
export const isLessonPlayable = (
  cellOrdinal: number,
  completedLessonIds: readonly string[],
  platformLevel: number,
): boolean => {
  const { status } = lessonAccess(
    cellOrdinal,
    completedLessonIds,
    platformLevel,
  );
  return status === 'AVAILABLE' || status === 'CURRENT';
};

export type { LessonStatus };
