// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The three budget directions, see docs/budget.md.
 *
 * They live in `economy` rather than next to the save because everything that
 * is not the save needs them too: the onboarding content is validated against
 * this tuple, and the shop and the summary screens speak the same three words.
 * A runtime tuple, not a bare union — a save is JSON, and `isUserSave` has to
 * check membership.
 */
export const BUDGET_DIRECTIONS = ['needs', 'wants', 'savings'] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One of the three budget directions. The same three words on every screen. */
type BudgetDirection = (typeof BUDGET_DIRECTIONS)[number];

export type { BudgetDirection };
