import type { BudgetDirection } from '@/entities/economy';

import type { BudgetComparison } from '../../model';
import { isOnPlan } from '../compare';
import { pickRecoveryOptions, type RecoveryTipId } from '../recovery';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** What the summary screen says after comparing plan and fact. */
interface SummaryExplain {
  /**
   * One short story that ties the deltas together — money moved, it did not
   * vanish. Empty when every direction landed on plan.
   */
  storyKey:
    | 'allOnPlan'
    | 'wantsAteSavings'
    | 'needsOver'
    | 'mixed'
    | 'underspent';
  /** Directions that went over plan, for interpolation in the story. */
  overspent: BudgetDirection[];
  /** Directions that finished under plan. */
  underspent: BudgetDirection[];
  /**
   * Concrete next-period tips (2.5.9). Never empty: even a perfect period gets
   * a gentle habit tip so the screen never ends on a shrug.
   * Chosen by `pickRecoveryOptions` — the recovery screen owns the actions.
   */
  tipKeys: RecoveryTipId[];
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Turns comparison rows into a child-readable story and recovery tips.
 *
 * Colour is not used as the carrier — the keys map to copy with `+` / `−`
 * and plain verbs, see docs/budget.md and docs/accessibility.md.
 */
export const explainSummary = (rows: BudgetComparison[]): SummaryExplain => {
  const overspent = rows
    .filter((row) => row.delta > 0)
    .map((row) => row.direction);
  const underspent = rows
    .filter((row) => row.delta < 0)
    .map((row) => row.direction);
  const allOnPlan = rows.every(isOnPlan);

  if (allOnPlan) {
    return {
      storyKey: 'allOnPlan',
      overspent,
      underspent,
      tipKeys: pickRecoveryOptions(rows).map((row) => row.id),
    };
  }

  const wantsOver = overspent.includes('wants');
  const savingsUnder = underspent.includes('savings');
  const needsOver = overspent.includes('needs');

  let storyKey: SummaryExplain['storyKey'] = 'mixed';
  if (wantsOver && savingsUnder) storyKey = 'wantsAteSavings';
  else if (needsOver) storyKey = 'needsOver';
  else if (overspent.length === 0 && underspent.length > 0) {
    storyKey = 'underspent';
  }

  return {
    storyKey,
    overspent,
    underspent,
    tipKeys: pickRecoveryOptions(rows).map((row) => row.id),
  };
};

export type { SummaryExplain };
