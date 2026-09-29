import { describe, expect, it } from 'vitest';

import { listLessons } from '../catalogue';

import { NAME_TOKEN, personalizeLesson } from './personalize';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Every string a lesson shows, flattened. */
const textsOf = (lesson: ReturnType<typeof listLessons>[number]): string[] => [
  lesson.title,
  lesson.shortDescription ?? '',
  lesson.learningObjective ?? '',
  ...lesson.theory,
  lesson.scenario?.situation ?? '',
  ...(lesson.scenario?.actions.flatMap((action) => [
    action.title,
    action.consequence,
  ]) ?? []),
  ...lesson.questions.flatMap((question) => [
    question.question,
    ...question.options,
    question.explanation ?? '',
  ]),
];

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('personalizeLesson', () => {
  it('puts the dog’s name wherever the content leaves a slot', () => {
    const lessons = listLessons().map((lesson) =>
      personalizeLesson(lesson, 'Кузя-01'),
    );
    const texts = lessons.flatMap(textsOf);

    expect(texts.some((text) => text.includes('Кузя-01'))).toBe(true);
    expect(texts.filter((text) => text.includes(NAME_TOKEN))).toEqual([]);
  });

  it('leaves no hardcoded hero in the content', () => {
    const texts = listLessons().flatMap(textsOf);

    expect(texts.filter((text) => /Финни|Finni/.test(text))).toEqual([]);
  });

  it('never needs the name declined — no "у {{name}}" in the content', () => {
    const texts = listLessons().flatMap(textsOf);

    expect(
      texts.filter((text) => /(^|\s)[Уу] \{\{name\}\}/.test(text)),
    ).toEqual([]);
  });

  it('keeps the answers where they were', () => {
    const [lesson] = listLessons();
    const named = personalizeLesson(lesson, 'Бобик');

    expect(named.questions.map((question) => question.answerIndex)).toEqual(
      lesson.questions.map((question) => question.answerIndex),
    );
    expect(named.id).toBe(lesson.id);
  });
});
