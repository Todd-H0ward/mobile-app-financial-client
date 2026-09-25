import { useCallback, useEffect, useMemo, useReducer } from 'react';

import {
  INITIAL_LESSON_SESSION,
  isPassed,
  type Lesson,
  type LessonAction,
  type LessonStage,
  lessonAt,
  passMark,
  transitionLesson,
  useCompleteLesson,
} from '@/entities/lesson';
import { cellFromKey, cellKey, cellOrdinal } from '@/entities/scene';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LessonState {
  /** The lesson behind this cell, or `null` if the route named no real cell. */
  lesson: Lesson | null;
  /** Its place in the arena, `1`-based — the number written on the tile. */
  number: number;
  /** Where the child is. */
  stage: LessonStage;
  /** Which paragraph or question is on screen, `0`-based. */
  index: number;
  /** How many there are of whichever is on screen. */
  total: number;
  /**
   * What was answered last, and whether it was right.
   *
   * Held for a beat so the machine can say so before moving on — a test that
   * silently advances teaches nothing.
   */
  verdict: { chosen: number; isRight: boolean } | null;
  /** Right answers so far. */
  correct: number;
  /** How many of them it takes to sink the cell. */
  needed: number;
  /** Whether the finished test cleared the bar. */
  isPassed: boolean;
  /** Turns the page, or moves from the theory into the test. */
  next: () => void;
  /** Answers the question on screen. Each is answered once. */
  answer: (option: number) => void;
  /** Wipes the score and reads the theory again. */
  retry: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * One lesson, from its cell's key.
 *
 * The cell is the argument rather than the lesson, because what the child
 * pressed is a tile and what has to sink afterwards is that same tile — the
 * lesson on it is a lookup.
 *
 * The test is answered once per question and scored at the end, rather than
 * retried until right: a score nobody can miss is not a result worth showing.
 * Missing it is still not a dead end — `retry` reads the lesson again.
 */
export const useLesson = (cellId: string): LessonState => {
  const completeCell = useCompleteLesson();

  const cell = useMemo(() => cellFromKey(cellId), [cellId]);
  const lesson = useMemo(
    () => (cell ? lessonAt(cellOrdinal(cell)) : null),
    [cell],
  );

  const [session, dispatch] = useReducer(
    (current: typeof INITIAL_LESSON_SESSION, action: LessonAction) =>
      transitionLesson(current, lesson, action),
    INITIAL_LESSON_SESSION,
  );
  const { stage, index, correct, verdict } = session;
  useEffect(() => {
    void cellId;
    dispatch({ type: 'reset' });
  }, [cellId]);
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

  // Recorded in an effect, not on the way through render: writing to a store
  // while rendering updates another component mid-render, which React is
  // right to complain about. The tile is down by the time the child has read
  // the result either way.
  useEffect(() => {
    if (stage !== 'result' || !passed || !cell) return;

    completeCell(cellKey(cell));
  }, [cell, completeCell, passed, stage]);

  return {
    lesson,
    number: cell ? cellOrdinal(cell) + 1 : 0,
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
