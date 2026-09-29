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
  sector: 0,
  level: 1,
  ...over,
});

/** Ninety lessons placed 5 / 7 / 8 / 10 up the steps of each theme. */
const ninety = () =>
  Array.from({ length: 90 }, (_, index) => {
    const position = index % 30;
    const level = position < 5 ? 1 : position < 12 ? 2 : position < 20 ? 3 : 4;
    return lesson({
      id: `lesson-${index}`,
      sector: Math.floor(index / 30),
      level,
    });
  });

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

  it('places every lesson on a theme and a step', () => {
    for (const entry of assertLessonContent(LESSON_CONTENT).lessons) {
      expect([0, 1, 2]).toContain(entry.sector);
      expect([1, 2, 3, 4]).toContain(entry.level);
    }
  });

  it('agrees every number with «монета» and «период»', () => {
    // 1, 21 монета(у) · 2–4, 22–24 монеты · the rest монет. A genitive after «до», «из»,
    // «после» and friends takes монет / периодов for any number, so those are let through.
    const genitive =
      /(до|из|после|больше|меньше|около|более|менее|хватает|нет)\s+$/i;
    const categoryOf = (count: number) => {
      const last = count % 10;
      const lastTwo = count % 100;
      if (last === 1 && lastTwo !== 11) return 'one';
      if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14))
        return 'few';
      return 'many';
    };
    const text = JSON.stringify(LESSON_CONTENT);
    const wrong: string[] = [];

    for (const match of text.matchAll(
      /(?<![\d.,])(\d+) (монет|периодов)(?![а-я])/g,
    )) {
      const before = text.slice(
        Math.max(0, (match.index ?? 0) - 20),
        match.index,
      );
      if (categoryOf(Number(match[1])) !== 'many' && !genitive.test(before)) {
        wrong.push(`${before}${match[0]}`);
      }
    }

    expect(wrong).toEqual([]);
  });
});

describe('assertLessonContent', () => {
  it('accepts a well-formed file', () => {
    expect(() => assertLessonContent({ lessons: ninety() })).not.toThrow();
  });

  it('accepts fewer than ninety — the arena cuts itself to the content', () => {
    expect(() =>
      assertLessonContent({ lessons: ninety().slice(0, 89) }),
    ).not.toThrow();
  });

  it('refuses a lesson with no theme or no step', () => {
    for (const over of [
      { sector: undefined },
      { sector: 3 },
      { sector: 1.5 },
      { level: undefined },
      { level: 0 },
      { level: 5 },
    ]) {
      expect(() => assertLessonContent({ lessons: [lesson(over)] })).toThrow();
    }
  });

  it('refuses a step fuller than its cells can be read', () => {
    const crowded = Array.from({ length: 8 }, (_, index) =>
      lesson({ id: `crowded-${index}`, sector: 0, level: 1 }),
    );
    expect(() => assertLessonContent({ lessons: crowded })).toThrow(
      /theme 0, step 1 holds 8 lessons/,
    );
  });

  it('refuses an empty file — there would be no arena at all', () => {
    expect(() => assertLessonContent({ lessons: [] })).toThrow(/at least 1/);
  });

  it('refuses a duplicate id, which would split progress', () => {
    const lessons = ninety();
    lessons[3] = lesson({ id: 'lesson-0' });

    expect(() => assertLessonContent({ lessons })).toThrow(/duplicate id/);
  });

  it('refuses an answer that points past the options', () => {
    const lessons = ninety();
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
    const lessons = ninety();
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
    const lessons = ninety();
    lessons[0] = lesson({ theory: ['Один абзац.'] });

    expect(() => assertLessonContent({ lessons })).toThrow(/theory/);
  });

  it('refuses a test of one question — that is a guess, not a test', () => {
    const lessons = ninety();
    lessons[0] = lesson({
      questions: [
        { question: 'Зачем?', options: ['a', 'b', 'c'], answerIndex: 0 },
      ],
    });

    expect(() => assertLessonContent({ lessons })).toThrow(/questions/);
  });
});
