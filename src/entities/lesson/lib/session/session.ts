import type { Lesson } from '../../model';

type LessonStage = 'theory' | 'scenario' | 'test' | 'result';
interface LessonSession {
  stage: LessonStage;
  index: number;
  correct: number;
  verdict: { chosen: number; isRight: boolean } | null;
}
type LessonAction =
  | { type: 'reset' }
  | { type: 'next'; stage: LessonStage; index: number }
  | { type: 'answer'; index: number; option: number };

export const INITIAL_LESSON_SESSION: LessonSession = {
  stage: 'theory',
  index: 0,
  correct: 0,
  verdict: null,
};

/** Expected stage/index consumes each tap once, including before React renders. */
export const transitionLesson = (
  state: LessonSession,
  lesson: Lesson | null,
  action: LessonAction,
): LessonSession => {
  if (action.type === 'reset') return INITIAL_LESSON_SESSION;
  if (!lesson || state.index !== action.index) return state;
  if (action.type === 'answer') {
    if (state.stage === 'scenario') {
      const choice = lesson.scenario?.actions[action.option];
      if (state.verdict || !Number.isInteger(action.option) || !choice)
        return state;
      return {
        ...state,
        verdict: { chosen: action.option, isRight: choice.isRecommended },
      };
    }
    const question = lesson.questions[state.index];
    if (
      state.stage !== 'test' ||
      state.verdict ||
      !question ||
      !Number.isInteger(action.option) ||
      action.option < 0 ||
      action.option >= question.options.length
    )
      return state;
    const isRight = question.answerIndex === action.option;
    return {
      ...state,
      correct: state.correct + (isRight ? 1 : 0),
      verdict: { chosen: action.option, isRight },
    };
  }
  if (action.stage !== state.stage || state.stage === 'result') return state;
  if (state.stage === 'theory') {
    return state.index + 1 < lesson.theory.length
      ? { ...state, index: state.index + 1 }
      : { ...state, stage: lesson.scenario ? 'scenario' : 'test', index: 0 };
  }
  if (!state.verdict) return state;
  if (state.stage === 'scenario')
    return { ...state, stage: 'test', index: 0, verdict: null };
  return state.index + 1 < lesson.questions.length
    ? { ...state, index: state.index + 1, verdict: null }
    : { ...state, stage: 'result' };
};

export type { LessonAction, LessonSession, LessonStage };
