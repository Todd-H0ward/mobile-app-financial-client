import {
  BUDGET_DIRECTIONS,
  PERIOD_HISTORY_LIMIT,
  PERIOD_NEED_DECAY,
  PLATFORM_GOAL_ID,
  REGULARITY_BONUS,
  WALLET_SOURCES,
} from '@/entities/economy';
import { type GrowthFacts, growRobotDog } from '@/entities/robot-dog';
import { nextTaskId } from '@/entities/task';

import { clamp } from '@/shared/utils';

// The types module, not the slice barrel: the barrel carries the store,
// and with it `expo-sqlite`, which the node test runner cannot parse.
import type { PeriodRecord, UserSave } from '../../model';
import { buildPeriodReport, computeAdjustment } from '../period-report';
import { creditWallet } from '../wallet';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * True when the plan has at least one direction with a non-zero allocation.
 * The "End day" button is available only then — see docs/game-period.md.
 */
const hasPlanEntry = (user: UserSave): boolean =>
  user.period.plan.needs > 0 ||
  user.period.plan.wants > 0 ||
  user.period.plan.savings > 0;

/**
 * History / phase stamps. Optional `at` is for tests and demos; production
 * callers pass nothing and get a monotonic counter from the save — the
 * period engine never reads the wall clock (0.3-R).
 */
const stampAt = (user: UserSave, at?: number): number =>
  at ?? user.period.phaseEnteredAt + 1;

/**
 * What the child has decided across every finished period.
 *
 * Counted from the history rather than kept as three counters in the save:
 * the history is the record, and a counter that can drift from it is a bug
 * waiting for a refund or a corrected period.
 */
export const growthFacts = (history: PeriodRecord[]): GrowthFacts => ({
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
 * @throws {Error} If the current phase is not `planning`.
 * @throws {Error} If the plan is all-zeros.
 */
export const startPeriod = (user: UserSave, at?: number): UserSave => {
  if (user.period.phase !== 'planning') {
    throw new Error(
      `startPeriod: expected phase 'planning', got '${user.period.phase}'`,
    );
  }

  const allocations = BUDGET_DIRECTIONS.map(
    (direction) => user.period.plan[direction],
  );
  if (
    !allocations.every(
      (amount) => Number.isSafeInteger(amount) && amount >= 0,
    ) ||
    allocations.reduce((total, amount) => total + amount, 0) >
      user.wallet.balance
  ) {
    throw new Error(
      'startPeriod: plan must contain whole coins within the wallet balance',
    );
  }

  // Empty plan is only legal when there is nothing to allocate — the child
  // enters `active` to earn on chores. A non-empty wallet still requires a
  // real plan (docs/budget.md).
  if (!hasPlanEntry(user) && user.wallet.balance > 0) {
    throw new Error(
      'startPeriod: plan must have at least one non-zero direction',
    );
  }

  return {
    ...user,
    period: {
      ...user.period,
      phase: 'active',
      fact: { needs: 0, wants: 0, savings: 0 },
      phaseEnteredAt: stampAt(user, at),
    },
  };
};

/**
 * `active → summary`
 *
 * The child confirmed "End day". Plan and fact freeze for the summary screen;
 * settlement runs later in `endPeriod`.
 *
 * @throws {Error} If the current phase is not `active`.
 */
export const finishPeriod = (user: UserSave, at?: number): UserSave => {
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
      phaseEnteredAt: stampAt(user, at),
    },
  };
};

/**
 * `summary → planning`, settling the finished period on the way (0.3-R).
 *
 * One action-driven step — no wall clock, no offline catch-up:
 *
 * 1. Need decay for charge / spirit (table, not a tick).
 * 2. History row, regularity bonus, stage, wipe plan/fact/tasks, index++.
 *
 * @throws {Error} If the current phase is not `summary`.
 */
export const endPeriod = (user: UserSave, at?: number): UserSave => {
  if (user.period.phase !== 'summary') {
    throw new Error(
      `endPeriod: expected phase 'summary', got '${user.period.phase}'`,
    );
  }

  const endedAt = stampAt(user, at);
  const { period, savings } = user;

  const isPlanKept = BUDGET_DIRECTIONS.every(
    (direction) => period.fact[direction] <= period.plan[direction],
  );

  const reachedGoalIds = savings.goals
    .filter((g) => g.reachedInPeriod === period.index)
    .map((g) => g.goalId);

  // Spending the completed jar buys permanent progress; it must not erase
  // the goal achievement used for this period's growth calculation.
  if (
    user.platform.receipts.some(
      (receipt) => receipt.periodIndex === period.index,
    ) &&
    !reachedGoalIds.includes(PLATFORM_GOAL_ID)
  ) {
    reachedGoalIds.push(PLATFORM_GOAL_ID);
  }

  const report = buildPeriodReport(user);

  const walletAfterBonus =
    savings.depositsThisPeriod > 0
      ? creditWallet(user.wallet, {
          source: WALLET_SOURCES.regularityBonus,
          amount: REGULARITY_BONUS,
          direction: null,
          periodIndex: period.index,
          at: endedAt,
        })
      : user.wallet;

  // Budget adherence consequence: bonus for meeting the plan, penalty for
  // overspending. Levels and non-liquid savings are never touched (ТЗ §2.2).
  // Penalty is taken from the post-bonus liquid balance so a child who
  // deposited still feels the miss on what they kept in the wallet.
  const adjustment = computeAdjustment(isPlanKept, walletAfterBonus.balance);
  const wallet =
    adjustment > 0
      ? creditWallet(walletAfterBonus, {
          source: 'bonus:budget-met',
          amount: adjustment,
          direction: null,
          periodIndex: period.index,
          at: endedAt,
        })
      : adjustment < 0
        ? {
            ...walletAfterBonus,
            balance: Math.max(0, walletAfterBonus.balance + adjustment),
          }
        : walletAfterBonus;

  const charge = clamp(user.robot.charge - PERIOD_NEED_DECAY.charge, 0, 1);
  const spirit = clamp(user.robot.spirit - PERIOD_NEED_DECAY.spirit, 0, 1);

  // Facts are counted on the full append first: trimming must not shrink the
  // counters that just earned a stage (goals that aged out of the window stay
  // reflected in `robot.stage`, which never goes backwards).
  const history: PeriodRecord[] = [
    ...user.history,
    {
      index: period.index,
      plan: period.plan,
      fact: period.fact,
      isPlanKept,
      reachedGoalIds,
      endedAt,
      earned: report.earned,
      adjustment,
      robotCharge: charge,
      robotSpirit: spirit,
    },
  ];
  const stage = growRobotDog(user.robot.stage, growthFacts(history));
  const trimmedHistory =
    history.length > PERIOD_HISTORY_LIMIT
      ? history.slice(-PERIOD_HISTORY_LIMIT)
      : history;

  return {
    ...user,
    robot: {
      ...user.robot,
      charge,
      spirit,
      stage,
    },
    wallet,
    period: {
      index: period.index + 1,
      phase: 'planning',
      plan: { needs: 0, wants: 0, savings: 0 },
      fact: { needs: 0, wants: 0, savings: 0 },
      phaseEnteredAt: endedAt,
    },
    savings: {
      ...savings,
      depositsThisPeriod: 0,
    },
    tasks: {
      completedThisPeriod: [],
      activeTaskId: nextTaskId([]),
    },
    history: trimmedHistory,
  };
};

/**
 * @deprecated Prefer `endPeriod` — kept as a named alias for call-site clarity
 * during the 0.3-R rename.
 */
export const acknowledgeSummary = endPeriod;

// ═══════════════════════════════════════════
// GUARDS
// ═══════════════════════════════════════════

/**
 * Whether the "End day" button can start the confirm flow.
 *
 * Active phase only. An empty plan is legal when the wallet was empty at
 * `startPeriod` (earn-first softlock escape), so we no longer require a
 * non-zero plan here — docs/game-period.md still gates spending behind
 * planning when there was something to allocate.
 */
export const canFinishPeriod = (user: UserSave): boolean =>
  user.period.phase === 'active';

/**
 * Whether planned needs are covered by fact — drives the warn state on the
 * End day button (soft warning, never a block).
 */
export const areNeedsMet = (user: UserSave): boolean =>
  user.period.fact.needs >= user.period.plan.needs;

/**
 * HUD status for the End day control (0.3-R).
 *
 * - `disabled` — cannot end (wrong phase / empty plan)
 * - `ready` — needs covered
 * - `warn` — can end, but needs are under plan
 */
export type EndPeriodStatus = 'disabled' | 'ready' | 'warn';

export const endPeriodStatus = (user: UserSave): EndPeriodStatus => {
  if (!canFinishPeriod(user)) return 'disabled';
  return areNeedsMet(user) ? 'ready' : 'warn';
};
