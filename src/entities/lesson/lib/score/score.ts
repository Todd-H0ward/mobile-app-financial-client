// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Share of the test that has to be right for the cell to sink. */
const LESSON_PASS_SHARE = 2 / 3;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** How many right answers a test of this length needs. */
const passMark = (total: number): number =>
  total <= 0 ? 0 : Math.ceil(total * LESSON_PASS_SHARE);

const isPassed = (correct: number, total: number): boolean =>
  total > 0 && correct >= passMark(total);

export { isPassed, LESSON_PASS_SHARE, passMark };
