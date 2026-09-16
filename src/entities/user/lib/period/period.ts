import { BUDGET_DIRECTIONS } from '@/entities/economy';
import { type GrowthFacts, growPet } from '@/entities/pet';

import type { TimeSource } from '@/shared/lib/time-source';

// The types module, not the slice barrel: the barrel carries the store,
// and with it `expo-sqlite`, which the node test runner cannot parse.
import type { PeriodRecord, UserSave } from '../../model/types';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * True when the plan has at least one direction with a non-zero allocation.
 * The "End Period" button is available only then — see docs/game-period.md.
 */
const hasPlanEntry = (user: UserSave): boolean =>
  user.period.plan.needs > 0 ||
  user.period.plan.wants > 0 ||
  user.period.plan.savings > 0;

/**
 * What the child has decided across every finished period.
 *
 * Counted from the history rather than kept as three counters in the save:
 * the history is the record, and a counter that can drift from it is a bug
 * waiting for a refund or a corrected period.
 *
 * Goals are counted as distinct ids — reaching one goal twice, which a
 * withdrawal and a re-save make possible, is still one goal.
 */
const growthFacts = (history: PeriodRecord[]): GrowthFacts => ({
  periods: history.length,
  goalsReached: new Set(history.flatMap((record) => record.reachedGoalIds))
    .size,
  plansKept: history.filter((record) => record.isPlanKept).length,
});

// ═══════════════════════════════════════════
// STATE MACHINE TRANSITIONS
// ═══════════════════════════════════════════

/**
 * `planning → active`
 *
 * The child has set their budget plan and confirmed it. The period is now live:
 * facts start accumulating, purchases are charged to the plan.
 *
 * Guard: at least one direction must have a non-zero allocation — there is
 * nothing to track otherwise. Callers should check `canStartPeriod` before
 * offering the transition.
 *
 * @throws {Error} If the current phase is not `planning`.
 * @throws {Error} If the plan is all-zeros.
 */
export const startPeriod = (user: UserSave, time: TimeSource): UserSave => {
  if (user.period.phase !== 'planning') {
    throw new Error(
      `startPeriod: expected phase 'planning', got '${user.period.phase}'`,
    );
  }

  if (!hasPlanEntry(user)) {
    throw new Error(
      'startPeriod: plan must have at least one non-zero direction',
    );
  }

  return {
    ...user,
    period: {
      ...user.period,
      phase: 'active',
      // Fact starts clean — any carried balance is irrelevant to the new period.
      fact: { needs: 0, wants: 0, savings: 0 },
      phaseEnteredAt: time.now(),
    },
  };
};

/**
 * `active → summary`
 *
 * The child pressed "End Period". The plan is frozen; the fact is what was
 * recorded during the active phase. The summary screen shows the comparison.
 *
 * @throws {Error} If the current phase is not `active`.
 */
export const finishPeriod = (user: UserSave, time: TimeSource): UserSave => {
  if (user.period.phase !== 'active') {
    throw new Error(
      `finishPeriod: expected phase 'active', got '${user.period.phase}'`,
    );
  }

  return {
    ...user,
    period: {
      ...user.period,
      phase: 'summary',
      phaseEnteredAt: time.now(),
    },
  };
};

/**
 * `summary → planning`, settling the finished period on the way
 *
 * The child (or the grown-up in demo mode) dismissed the summary screen.
 * Settlement happens atomically — there is no in-between state the UI ever
 * sees — so the transition goes directly to the next `planning` phase:
 *
 * 1. The finished period is recorded in `history` (plan, fact, outcome).
 * 2. `isPlanKept` — no direction exceeded its allocation.
 * 3. Goals reached during this period are captured in `reachedGoalIds`.
 * 4. The period counter advances.
 * 5. `depositsThisPeriod` is reset so the regularity bonus starts clean.
 * 6. Plan and fact are wiped for the new period.
 * 7. The pet grows if the whole history has earned it — and only upwards.
 *
 * @throws {Error} If the current phase is not `summary`.
 */
export const acknowledgeSummary = (
  user: UserSave,
  time: TimeSource,
): UserSave => {
  if (user.period.phase !== 'summary') {
    throw new Error(
      `acknowledgeSummary: expected phase 'summary', got '${user.period.phase}'`,
    );
  }

  const { period, savings } = user;
  const endedAt = time.now();

  // A direction is "kept" when the fact did not exceed the plan — all three,
  // zero-plan ones included. Spending in a direction nothing was allocated to
  // is the plainest way to break a plan, so it must not score as kept.
  const isPlanKept = BUDGET_DIRECTIONS.every(
    (direction) => period.fact[direction] <= period.plan[direction],
  );

  const reachedGoalIds = savings.goals
    .filter((g) => g.reachedInPeriod === period.index)
    .map((g) => g.goalId);

  const history: PeriodRecord[] = [
    ...user.history,
    {
      index: period.index,
      plan: period.plan,
      fact: period.fact,
      isPlanKept,
      reachedGoalIds,
      endedAt,
    },
  ];

  return {
    ...user,
    pet: {
      ...user.pet,
      // Growth is judged on the whole history, not on this period: 2.5.10 asks
      // for a decision made over several periods, see docs/pet.md.
      stage: growPet(user.pet.stage, growthFacts(history)),
    },
    period: {
      index: period.index + 1,
      phase: 'planning',
      plan: { needs: 0, wants: 0, savings: 0 },
      fact: { needs: 0, wants: 0, savings: 0 },
      phaseEnteredAt: endedAt,
    },
    savings: {
      ...savings,
      // Reset so that the regularity bonus counts only this period's deposits.
      depositsThisPeriod: 0,
    },
    history,
  };
};

// ═══════════════════════════════════════════
// GUARDS
// ═══════════════════════════════════════════

/**
 * Whether the "End Period" button should be enabled.
 *
 * The button is active during `active` phase only, and only when at least one
 * plan direction has a non-zero allocation — otherwise there is nothing to
 * compare against in the summary.
 */
export const canFinishPeriod = (user: UserSave): boolean =>
  user.period.phase === 'active' && hasPlanEntry(user);
