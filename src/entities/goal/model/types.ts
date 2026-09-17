// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One row from `content/goals.json`. Title and price live here, never in the save. */
interface GoalContent {
  /** Stable id. The save addresses progress by this alone — 3.2. */
  id: string;
  title: string;
  /** Price in coins. Positive integer — a goal you cannot reach is not a goal. */
  price: number;
  /** Why this goal exists, for whoever rebalances the content. Not shown. */
  note?: string;
}

interface GoalsFile {
  goals: GoalContent[];
}

export type { GoalContent, GoalsFile };
