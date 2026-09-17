import {
  BUDGET_DIRECTIONS,
  PERIOD_NEED_DECAY,
  REGULARITY_BONUS,
  WALLET_SOURCES,
} from '@/entities/economy';
import { type GrowthFacts, growPet } from '@/entities/pet';
import { nextTaskId } from '@/entities/task';

import { clamp } from '@/shared/utils';

// The types module, not the slice barrel: the barrel carries the store,
// and with it `expo-sqlite`, which the node test runner cannot parse.
import type { PeriodRecord, UserSave } from '../../model';
import { creditWallet, debitWallet } from '../wallet';

import { buildBill } from './build-bill';

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
 * 1. Heating bill (once per period index).
 * 2. Need decay for comfort / spirit (table, not a tick).
 * 3. History row, regularity bonus, growth, wipe plan/fact/tasks, index++.
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
  let working: UserSave = user;
  let fact = { ...user.period.fact };

  // ── Heating bill (docs/house.md) ──────────────────────────────
  if (working.home.lastBilledPeriod !== working.period.index) {
    const bill = buildBill(
      working.home.temperature,
      working.home.insulationIds,
    );
    if (bill.total > 0) {
      const charge = Math.min(bill.total, working.wallet.balance);
      if (charge > 0) {
        const debit = debitWallet(working.wallet, {
          source: WALLET_SOURCES.heatingBill,
          amount: charge,
          direction: 'needs',
          periodIndex: working.period.index,
          at: endedAt,
        });
        if (debit.ok) {
          working = { ...working, wallet: debit.wallet };
          fact = { ...fact, needs: fact.needs + charge };
        }
      }
    }
    working = {
      ...working,
      home: {
        ...working.home,
        lastBilledPeriod: working.period.index,
      },
      period: { ...working.period, fact },
    };
  } else {
    working = { ...working, period: { ...working.period, fact } };
  }

  const { period, savings } = working;

  const isPlanKept = BUDGET_DIRECTIONS.every(
    (direction) => period.fact[direction] <= period.plan[direction],
  );

  const reachedGoalIds = savings.goals
    .filter((g) => g.reachedInPeriod === period.index)
    .map((g) => g.goalId);

  const history: PeriodRecord[] = [
    ...working.history,
    {
      index: period.index,
      plan: period.plan,
      fact: period.fact,
      isPlanKept,
      reachedGoalIds,
      endedAt,
    },
  ];

  const wallet =
    savings.depositsThisPeriod > 0
      ? creditWallet(working.wallet, {
          source: WALLET_SOURCES.regularityBonus,
          amount: REGULARITY_BONUS,
          direction: null,
          periodIndex: period.index,
          at: endedAt,
        })
      : working.wallet;

  const comfort = clamp(working.pet.comfort - PERIOD_NEED_DECAY.comfort, 0, 1);
  const spirit = clamp(working.pet.spirit - PERIOD_NEED_DECAY.spirit, 0, 1);

  return {
    ...working,
    pet: {
      ...working.pet,
      comfort,
      spirit,
      stage: growPet(working.pet.stage, growthFacts(history)),
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
    history,
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
 * Active phase only, and only when at least one plan direction is non-zero.
 */
export const canFinishPeriod = (user: UserSave): boolean =>
  user.period.phase === 'active' && hasPlanEntry(user);

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
