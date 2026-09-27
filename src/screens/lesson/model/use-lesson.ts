import { useCallback, useEffect, useMemo, useReducer } from 'react';

import {
  ARENA_LAYOUT,
  activeLessonIndexForCell,
  displayNumberForCell,
  INITIAL_LESSON_SESSION,
  isLessonPlayable,
  isPassed,
  type Lesson,
  type LessonAction,
  type LessonStage,
  lessonAt,
  listLessons,
  passMark,
  transitionLesson,
} from '@/entities/lesson';
import { cellFromKey, cellKey, cellOrdinal } from '@/entities/scene';
import { useCompleteLesson, useUser } from '@/entities/user';

import { SOUNDS } from '@/shared/constants';
import { playSfx } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LessonState {
  lesson: Lesson | null;
  number: number;
  lessonCount: number;
  stage: LessonStage;
  index: number;
  total: number;
  verdict: { chosen: number; isRight: boolean } | null;
  correct: number;
  needed: number;
  isPassed: boolean;
  next: () => void;
  answer: (option: number) => void;
  retry: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Keyed by cell so the pressed tile is what sinks after the lesson. */
export const useLesson = (cellId: string): LessonState => {
  const completeCell = useCompleteLesson();
  const user = useUser();

  const cell = useMemo(() => cellFromKey(cellId, ARENA_LAYOUT), [cellId]);
  const ordinal = useMemo(
    () => (cell ? cellOrdinal(cell, ARENA_LAYOUT) : null),
    [cell],
  );
  const activeIndex = useMemo(() => {
    if (!user || ordinal === null) return null;
    if (
      !isLessonPlayable(
        ordinal,
        user.completedLessonIds,
        user.platform.level,
      )
    ) {
      return null;
    }
    return activeLessonIndexForCell(ordinal, user.completedLessonIds);
  }, [ordinal, user]);

  const lesson = useMemo(
    () => (activeIndex === null ? null : lessonAt(activeIndex)),
    [activeIndex],
  );

  const [session, dispatch] = useReducer(
    (current: typeof INITIAL_LESSON_SESSION, action: LessonAction) =>
      transitionLesson(current, lesson, action),
    INITIAL_LESSON_SESSION,
  );
  const { stage, index, correct, verdict } = session;
  useEffect(() => {
    void cellId;
    void lesson?.id;
    dispatch({ type: 'reset' });
  }, [cellId, lesson?.id]);

  useEffect(() => {
    if (!verdict) return;
    playSfx(verdict.isRight ? SOUNDS.CORRECT : SOUNDS.WRONG);
  }, [verdict]);

  const theoryCount = lesson?.theory.length ?? 0;
  const questionCount = lesson?.questions.length ?? 0;
  const total = stage === 'theory' ? theoryCount : questionCount;
  const next = useCallback(
    () => dispatch({ type: 'next', stage, index }),
    [stage, index],
  );
  const answer = useCallback(
    (option: number) => dispatch({ type: 'answer', index, option }),
    [index],
  );
  const retry = useCallback(() => dispatch({ type: 'reset' }), []);

  const passed = isPassed(correct, questionCount);

  // Effect, not render — writing a store mid-render updates another component.
  useEffect(() => {
    if (stage !== 'result' || !passed || !cell) return;

    completeCell(cellKey(cell));
  }, [cell, completeCell, passed, stage]);

  return {
    lesson,
    // Tile number, not file order — lessons are placed by theme and step.
    number:
      activeIndex !== null && ordinal !== null
        ? displayNumberForCell(ordinal)
        : 0,
    lessonCount: listLessons().length,
    stage,
    index,
    total,
    verdict,
    correct,
    needed: passMark(questionCount),
    isPassed: passed,
    next,
    answer,
    retry,
  };
};

export type { LessonStage, LessonState };
