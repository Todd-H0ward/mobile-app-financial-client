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

/** The ordinal a key names, or `null` for a cell this arena does not have. */
export const lessonOrdinalForKey = (key: string): number | null => {
  const cell = cellFromKey(key, ARENA_LAYOUT);
  return cell ? layoutOrdinal(ARENA_LAYOUT, cell) : null;
};

/**
 * Whether a cell may be held, and how it paints.
 *
 * A row — one step of one bay — opens as a whole: the platform has to have
 * climbed to that step and the row below it in the same bay has to be done.
 * The three bays climb side by side. Both rules come from `ARENA_LAYOUT`,
 * not from `unlockCondition` in `lessons.json`, which names cells of the old
 * six-to-a-row cut; a rule that lives in the layout keeps holding however
 * the content grows. The first unfinished cell of an open row is the one
 * suggested.
 *
 * Unlock rules read the **base** lesson on the cell (layer 0). Extra lessons
 * stacked from `lessons.json` play on the same cell once it is open.
 */
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

export type { LessonStatus };
