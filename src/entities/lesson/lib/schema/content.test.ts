import { describe, expect, it } from 'vitest';

import { assertLessonContent } from './schema';

import LESSON_CONTENT from '@/content/lessons.json';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A valid lesson, for tests that break one field at a time. */
const lesson = (over: Record<string, unknown> = {}) => ({
  id: 'money',
  title: 'Деньги',
  theory: ['Первый.', 'Второй.', 'Третий.'],
  questions: [
    { question: 'Зачем?', options: ['a', 'b', 'c'], answerIndex: 2 },
    { question: 'Почему?', options: ['a', 'b', 'c'], answerIndex: 0 },
    { question: 'Когда?', options: ['a', 'b', 'c'], answerIndex: 1 },
  ],
  ...over,
});

/** A segment's worth, which is the floor the schema enforces. */
const thirty = () =>
  Array.from({ length: 30 }, (_, index) => lesson({ id: `lesson-${index}` }));

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('content/lessons.json', () => {
  it('passes its own schema', () => {
    expect(() => assertLessonContent(LESSON_CONTENT)).not.toThrow();
  });

  it('answers every question with one of its own options', () => {
    const { lessons } = assertLessonContent(LESSON_CONTENT);

    for (const entry of lessons) {
      for (const question of entry.questions) {
        expect(question.options[question.answerIndex]).toBeTruthy();
      }
    }
  });

  it('fills a whole segment — five terraces of six cells', () => {
    expect(assertLessonContent(LESSON_CONTENT).lessons).toHaveLength(30);
  });
});

describe('assertLessonContent', () => {
  it('accepts a well-formed file', () => {
    expect(() => assertLessonContent({ lessons: thirty() })).not.toThrow();
  });

  it('refuses too few lessons — a segment would repeat one', () => {
    expect(() =>
      assertLessonContent({ lessons: thirty().slice(0, 29) }),
    ).toThrow(/at least 30/);
  });

  it('refuses a duplicate id, which would split progress', () => {
    const lessons = thirty();
    lessons[3] = lesson({ id: 'lesson-0' });

    expect(() => assertLessonContent({ lessons })).toThrow(/duplicate id/);
  });

  it('refuses an answer that points past the options', () => {
    const lessons = thirty();
    lessons[0] = lesson({
      questions: [
        { question: 'Зачем?', options: ['a', 'b', 'c'], answerIndex: 3 },
        { question: 'Почему?', options: ['a', 'b', 'c'], answerIndex: 0 },
        { question: 'Когда?', options: ['a', 'b', 'c'], answerIndex: 1 },
      ],
    });

    expect(() => assertLessonContent({ lessons })).toThrow(/answerIndex/);
  });

  it('refuses a coin toss — two options are not a choice', () => {
    const lessons = thirty();
    lessons[0] = lesson({
      questions: [
        { question: 'Зачем?', options: ['a', 'b'], answerIndex: 0 },
        { question: 'Почему?', options: ['a', 'b', 'c'], answerIndex: 0 },
        { question: 'Когда?', options: ['a', 'b', 'c'], answerIndex: 1 },
      ],
    });

    expect(() => assertLessonContent({ lessons })).toThrow(/at least 3/);
  });

  it('refuses a lesson with too little theory to read', () => {
    const lessons = thirty();
    lessons[0] = lesson({ theory: ['Один абзац.'] });

    expect(() => assertLessonContent({ lessons })).toThrow(/theory/);
  });

  it('refuses a test of one question — that is a guess, not a test', () => {
    const lessons = thirty();
    lessons[0] = lesson({
      questions: [
        { question: 'Зачем?', options: ['a', 'b', 'c'], answerIndex: 0 },
      ],
    });

    expect(() => assertLessonContent({ lessons })).toThrow(/questions/);
  });
});
