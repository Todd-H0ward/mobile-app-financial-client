import { listLessons } from '../catalogue';
import {
  ARENA_CELL_COUNT,
  activeLessonIndexForCell,
  completedCellKeysFromLessons,
} from '../layout';

type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'CURRENT' | 'COMPLETED';

export const lessonCellKey = (ordinal: number): string =>
  `${Math.floor(ordinal / 30)}-${Math.floor((ordinal % 30) / 6)}-${ordinal % 6}`;

export const lessonOrdinalForKey = (key: string): number | null => {
  if (!/^[0-2]-[0-4]-[0-5]$/.test(key)) return null;
  const [sector, level, index] = key.split('-').map(Number);
  return sector * 30 + level * 6 + index;
};

/**
 * Whether a cell may be held, and how it paints.
 *
 * Unlock rules read the **base** lesson on the disc (layer 0). Extra lessons
 * stacked from `lessons.json` play on the same disc once that cell is open —
 * content grows in one file without new geometry.
 */
export const lessonAccess = (
  cellOrdinal: number,
  completedLessonIds: readonly string[],
  platformLevel: number,
): { status: LessonStatus; requiredLevel: number; missing: number } => {
  if (
    !Number.isInteger(cellOrdinal) ||
    cellOrdinal < 0 ||
    cellOrdinal >= ARENA_CELL_COUNT
  ) {
    return { status: 'LOCKED', requiredLevel: 0, missing: 0 };
  }

  const lessons = listLessons();
  const base = lessons[cellOrdinal];
  const requiredLevel =
    base?.unlockCondition?.platformLevel ?? Math.floor((cellOrdinal % 30) / 6);

  const active = activeLessonIndexForCell(cellOrdinal, completedLessonIds);
  if (active === null) {
    return { status: 'COMPLETED', requiredLevel, missing: 0 };
  }

  const doneCells = new Set(completedCellKeysFromLessons(completedLessonIds));
  const preceding = base?.unlockCondition?.completedCells ?? [];
  const missing = preceding.filter((key) => !doneCells.has(key)).length;
  if (platformLevel < requiredLevel || missing > 0) {
    return { status: 'LOCKED', requiredLevel, missing };
  }

  const start = Math.floor(cellOrdinal / 6) * 6;
  const first = Array.from({ length: 6 }, (_, i) => start + i).find(
    (n) => activeLessonIndexForCell(n, completedLessonIds) !== null,
  );

  return {
    status: cellOrdinal === first ? 'CURRENT' : 'AVAILABLE',
    requiredLevel,
    missing: 0,
  };
};

export type { LessonStatus };
