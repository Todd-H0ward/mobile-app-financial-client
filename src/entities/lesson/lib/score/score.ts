// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Share of the test that has to be right for the cell to sink.
 *
 * Two of three. Not all of them: a child who has understood the lesson and
 * slipped on one wording has understood the lesson, and sending them round
 * again teaches nothing but resentment. Not one of three either — that is
 * what guessing scores.
 */
const LESSON_PASS_SHARE = 2 / 3;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** How many right answers a test of this length needs. */
const passMark = (total: number): number =>
  total <= 0 ? 0 : Math.ceil(total * LESSON_PASS_SHARE);

/** Whether a score clears the bar. */
const isPassed = (correct: number, total: number): boolean =>
  total > 0 && correct >= passMark(total);

export { isPassed, LESSON_PASS_SHARE, passMark };
