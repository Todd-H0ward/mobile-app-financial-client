import { describe, expect, it } from 'vitest';

import { INITIAL_LESSON_SESSION, transitionLesson } from './session';

const lesson = {
  id: 'test',
  title: 'Test',
  theory: ['One', 'Two'],
  questions: [
    { question: 'One?', options: ['a', 'b', 'c'], answerIndex: 0 },
    { question: 'Two?', options: ['a', 'b', 'c'], answerIndex: 1 },
  ],
};
const testState = { ...INITIAL_LESSON_SESSION, stage: 'test' as const };

describe('lesson session', () => {
  it('credits a correct answer once even when both taps precede rendering', () => {
    const action = { type: 'answer' as const, index: 0, option: 0 };
    const first = transitionLesson(testState, lesson, action);
    expect(transitionLesson(first, lesson, action)).toBe(first);
    expect(first.correct).toBe(1);
  });
  it('does not skip theory pages on a repeated next tap', () => {
    const action = {
      type: 'next' as const,
      stage: 'theory' as const,
      index: 0,
    };
    const first = transitionLesson(INITIAL_LESSON_SESSION, lesson, action);
    expect(first.index).toBe(1);
    expect(transitionLesson(first, lesson, action)).toBe(first);
  });
  it('requires an answer before advancing a question', () => {
    expect(
      transitionLesson(testState, lesson, {
        type: 'next',
        stage: 'test',
        index: 0,
      }),
    ).toBe(testState);
  });
  it.each([-1, 3, 0.5, Number.NaN])('ignores invalid option %s', (option) => {
    expect(
      transitionLesson(testState, lesson, { type: 'answer', index: 0, option }),
    ).toBe(testState);
  });
  it('keeps a wrong answer visible before moving on and never counts it as right', () => {
    const wrong = transitionLesson(testState, lesson, {
      type: 'answer',
      index: 0,
      option: 2,
    });
    expect(wrong.verdict).toEqual({ chosen: 2, isRight: false });
    const next = transitionLesson(wrong, lesson, {
      type: 'next',
      stage: 'test',
      index: 0,
    });
    expect(next).toMatchObject({ correct: 0, index: 1, verdict: null });
    const answered = transitionLesson(next, lesson, {
      type: 'answer',
      index: 1,
      option: 1,
    });
    const result = transitionLesson(answered, lesson, {
      type: 'next',
      stage: 'test',
      index: 1,
    });
    expect(result).toMatchObject({ stage: 'result', correct: 1 });
    expect(transitionLesson(result, lesson, { type: 'reset' })).toEqual(
      INITIAL_LESSON_SESSION,
    );
  });
});
