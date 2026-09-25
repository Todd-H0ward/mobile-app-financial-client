import { lessonOrdinalForKey, listLessons } from '@/entities/lesson';

import { isRecord } from '@/shared/utils';

import type { UserSave } from '../../model/types';

/** Valid cells only: arbitrary URLs must never become saved progress. */
export const isCompletedCellKey = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-2]-[0-4]-[0-5]$/.test(value);

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
  const completedLessonCells = [
    ...new Set([...user.completedLessonCells, ...cells]),
  ];
  const fromCells = completedLessonCells.map((key) => {
    const ordinal = lessonOrdinalForKey(key);
    return ordinal === null ? null : listLessons()[ordinal]?.id;
  });
  const completedLessonIds = [
    ...new Set([
      ...user.completedLessonIds,
      ...fromCells.filter((id): id is string => typeof id === 'string'),
    ]),
  ];
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
