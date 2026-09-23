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

/**
 * The lesson behind a cell, by that cell's place in the arena.
 *
 * Ninety cells and six lessons, so they repeat: the ordinal walks the list
 * and wraps. It is deliberate that this is arithmetic rather than a table —
 * a cell must lead to the same lesson today and tomorrow, and a table with
 * ninety rows in it would be ninety chances to get that wrong.
 */
export const lessonAt = (ordinal: number): Lesson => {
  const index =
    ((Math.trunc(ordinal) % LESSONS.length) + LESSONS.length) % LESSONS.length;

  return LESSONS[index];
};
