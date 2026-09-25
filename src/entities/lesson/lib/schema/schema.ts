import { isNonEmptyString, isRecord } from '@/shared/utils';

import type { Lesson, LessonFile, LessonQuestion } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Three sectors, five terraces and six distinct exercises per terrace. */
const MIN_LESSONS = 90;

/** Two would be a coin toss; three is a choice. */
const MIN_OPTIONS = 3;

/** A test is more than one question — one is a guess with a 1-in-3 chance. */
const MIN_QUESTIONS = 3;

/** Enough to be worth reading before being asked about it. */
const MIN_THEORY = 3;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const assertQuestion = (quiz: unknown, path: string): LessonQuestion => {
  if (!isRecord(quiz)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(quiz.question)) {
    throw new Error(`${path}.question: non-empty string required`);
  }
  if (!Array.isArray(quiz.options) || quiz.options.length < MIN_OPTIONS) {
    throw new Error(`${path}.options: at least ${MIN_OPTIONS} required`);
  }
  quiz.options.forEach((option, index) => {
    if (!isNonEmptyString(option)) {
      throw new Error(`${path}.options[${index}]: non-empty string required`);
    }
  });

  const { answerIndex } = quiz;
  if (quiz.explanation !== undefined && !isNonEmptyString(quiz.explanation)) {
    throw new Error(`${path}.explanation: non-empty string required`);
  }
  if (new Set(quiz.options).size !== quiz.options.length) {
    throw new Error(`${path}.options: answers must be distinct`);
  }
  if (
    typeof answerIndex !== 'number' ||
    !Number.isInteger(answerIndex) ||
    answerIndex < 0 ||
    answerIndex >= quiz.options.length
  ) {
    throw new Error(`${path}.answerIndex: must point at one of the options`);
  }

  return quiz as unknown as LessonQuestion;
};

const assertLesson = (lesson: unknown, path: string): Lesson => {
  if (!isRecord(lesson)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(lesson.id)) {
    throw new Error(`${path}.id: non-empty string required`);
  }
  if (!isNonEmptyString(lesson.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (!Array.isArray(lesson.theory) || lesson.theory.length < MIN_THEORY) {
    throw new Error(`${path}.theory: at least ${MIN_THEORY} paragraphs`);
  }
  lesson.theory.forEach((paragraph, index) => {
    if (!isNonEmptyString(paragraph)) {
      throw new Error(`${path}.theory[${index}]: non-empty string required`);
    }
  });

  if (
    !Array.isArray(lesson.questions) ||
    lesson.questions.length < MIN_QUESTIONS
  ) {
    throw new Error(`${path}.questions: at least ${MIN_QUESTIONS} required`);
  }
  lesson.questions.forEach((question, index) => {
    assertQuestion(question, `${path}.questions[${index}]`);
  });

  return lesson as unknown as Lesson;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/lessons.json`.
 *
 * A lesson is the only thing behind a cell, so a broken row is a cell the
 * child can never sink. It must fail in tests, not on the device.
 */
export const assertLessonContent = (data: unknown): LessonFile => {
  if (!isRecord(data)) {
    throw new Error('lesson content: must be an object');
  }
  if (!Array.isArray(data.lessons)) {
    throw new Error('lesson content: "lessons" must be an array');
  }
  if (data.lessons.length < MIN_LESSONS) {
    throw new Error(`lesson content: need at least ${MIN_LESSONS} lessons`);
  }

  const ids = new Set<string>();
  const lessons = data.lessons.map((lesson, index) => {
    const parsed = assertLesson(lesson, `lessons[${index}]`);
    if (ids.has(parsed.id)) {
      throw new Error(`lessons: duplicate id "${parsed.id}"`);
    }
    ids.add(parsed.id);
    return parsed;
  });

  return { lessons };
};
