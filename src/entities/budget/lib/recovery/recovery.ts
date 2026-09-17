import type { BudgetComparison } from '../../model';
import { isOnPlan } from '../compare';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Recovery tips the child can pick after a period (2.5.9 / roadmap 1.19).
 */
type RecoveryTipId =
  | 'saveFirst'
  | 'waitOnWant'
  | 'protectNeeds'
  | 'keepHabit'
  | 'checkPlan';

/** Screen the tip opens after settlement. */
type RecoveryDestination = 'budgetPlan' | 'home';

/**
 * One concrete next-period step — never empty, never a wipe, never a grade.
 */
interface RecoveryOption {
  /** Tip id — maps to `recovery.options.*`. */
  id: RecoveryTipId;
  /** Where the button navigates after acknowledging the summary. */
  destination: RecoveryDestination;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Stable list for schema / tests — display order when several match. */
const RECOVERY_TIP_IDS: readonly RecoveryTipId[] = [
  'saveFirst',
  'waitOnWant',
  'protectNeeds',
  'keepHabit',
  'checkPlan',
];

/**
 * Where choosing a tip sends the child after `acknowledgeSummary`.
 * Planning-phase destinations only — the next period has not started yet.
 */
const RECOVERY_DESTINATION: Record<RecoveryTipId, RecoveryDestination> = {
  saveFirst: 'budgetPlan',
  waitOnWant: 'home',
  protectNeeds: 'budgetPlan',
  keepHabit: 'home',
  checkPlan: 'budgetPlan',
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Picks one or two recovery options from the plan/fact comparison.
 *
 * Rules (docs/budget.md):
 * - wants over or savings under → save first
 * - wants over → wait on a want
 * - needs over → protect needs in the next plan
 * - otherwise → check the plan
 * - always pad to two tips with a gentle habit tip when only one matched
 * - a perfect period still gets habit + checkPlan so the screen never shrugs
 */
export const pickRecoveryOptions = (
  rows: readonly BudgetComparison[],
): RecoveryOption[] => {
  const overspent = rows
    .filter((row) => row.delta > 0)
    .map((row) => row.direction);
  const underspent = rows
    .filter((row) => row.delta < 0)
    .map((row) => row.direction);
  const allOnPlan = rows.every(isOnPlan);

  if (allOnPlan) {
    return [
      { id: 'keepHabit', destination: RECOVERY_DESTINATION.keepHabit },
      { id: 'checkPlan', destination: RECOVERY_DESTINATION.checkPlan },
    ];
  }

  const wantsOver = overspent.includes('wants');
  const savingsUnder = underspent.includes('savings');
  const needsOver = overspent.includes('needs');

  const ids: RecoveryTipId[] = [];
  if (savingsUnder || wantsOver) ids.push('saveFirst');
  if (wantsOver) ids.push('waitOnWant');
  if (needsOver) ids.push('protectNeeds');
  if (ids.length === 0) ids.push('checkPlan');
  if (ids.length < 2) ids.push('keepHabit');

  return ids.slice(0, 2).map((id) => ({
    id,
    destination: RECOVERY_DESTINATION[id],
  }));
};

export type { RecoveryDestination, RecoveryOption, RecoveryTipId };
export { RECOVERY_DESTINATION, RECOVERY_TIP_IDS };
