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
export const lessonAt = (index: number): Lesson => {
  if (!Number.isInteger(index) || index < 0 || index >= LESSONS.length) {
    throw new RangeError(
      `Lesson index must be 0…${LESSONS.length - 1} (content/lessons.json)`,
    );
  }
  return LESSONS[index];
};
