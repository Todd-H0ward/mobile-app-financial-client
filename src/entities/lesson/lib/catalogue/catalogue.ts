import type { Lesson } from '../../model';
import { assertLessonContent } from '../schema';

import LESSON_CONTENT from '@/content/lessons.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const LESSONS = assertLessonContent(LESSON_CONTENT).lessons;

export const listLessons = (): readonly Lesson[] => LESSONS;

export const getLessonById = (id: string): Lesson | undefined =>
  LESSONS.find((lesson) => lesson.id === id);

/** Stable arena order: foundations, savings practice, purchase decisions. */
export const lessonAt = (ordinal: number): Lesson => {
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= 90) {
    throw new RangeError(
      'Lesson ordinal must identify one of the 90 arena cells',
    );
  }
  return LESSONS[ordinal];
};
