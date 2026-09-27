import { completedCellKeysFromLessons, listLessons } from '@/entities/lesson';

import { isRecord } from '@/shared/utils';

import type { UserSave } from '../../model/types';

/** A key of the old arena grid: three bays × five rows × six cells. */
export const isCompletedCellKey = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-2]-[0-4]-[0-5]$/.test(value);

/** The lesson an old-grid key stood for: bay-major, six to a row. */
const legacyLessonId = (key: string): string | undefined => {
  const [sector, level, index] = key.split('-').map(Number);
  return listLessons()[sector * 30 + level * 6 + index]?.id;
};

/** Import the old profile-independent keys once, when upgrading to UserSave v9. */
export const importLegacyProgress = (
  user: UserSave,
  lessons: unknown,
  scores: unknown,
): UserSave => {
  const cells =
    isRecord(lessons) && Array.isArray(lessons.doneCells)
      ? lessons.doneCells
          .filter(isCompletedCellKey)
          .map((key) => `0${key.slice(1)}`)
      : [];
  const readScores = (value: unknown, direction: number): number[] =>
    Array.isArray(value)
      ? value
          .filter(
            (n): n is number =>
              typeof n === 'number' && Number.isSafeInteger(n) && n > 0,
          )
          .sort((a, b) => direction * (a - b))
          .slice(0, 5)
      : [];
  const completedLessonIds = [
    ...new Set([
      ...user.completedLessonIds,
      ...cells
        .map(legacyLessonId)
        .filter((id): id is string => typeof id === 'string'),
    ]),
  ];
  // Keys of the current arena, from the lessons — never the old keys as-is.
  const completedLessonCells = completedCellKeysFromLessons(completedLessonIds);
  return {
    ...user,
    completedLessonCells,
    completedLessonIds,
    arcade: {
      ...user.arcade,
      scores: {
        snake: readScores(isRecord(scores) ? scores.snake : [], -1),
        spacewarMs: readScores(isRecord(scores) ? scores.spacewarMs : [], 1),
      },
    },
  };
};
