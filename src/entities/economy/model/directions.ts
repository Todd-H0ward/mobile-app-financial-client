// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The three budget directions, see docs/budget.md. */
export const BUDGET_DIRECTIONS = ['needs', 'wants', 'savings'] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One of the three budget directions. The same three words on every screen. */
type BudgetDirection = (typeof BUDGET_DIRECTIONS)[number];

export type { BudgetDirection };
