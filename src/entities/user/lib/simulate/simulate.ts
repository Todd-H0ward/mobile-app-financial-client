import { getCatalogueItem } from '@/entities/catalogue';
import { getGoalById } from '@/entities/goal';
import { listTasks, rewardForTask } from '@/entities/task';

import { makeDemoTimeSource, type TimeSource } from '@/shared/lib/time-source';

// The types module and the factory, not the slice barrel: the barrel carries
// the store, and with it `expo-sqlite`, which the node test runner cannot parse.
import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';
import { DEMO_RUN_PERIODS } from '../demo';
import { buildBill, endPeriod, finishPeriod, startPeriod } from '../period';
import { applyPurchase } from '../purchase';
import { applyDeposit, setActiveGoal } from '../savings';
import { applyCompleteTask } from '../tasks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** How one imagined child plays, period after period. */
interface SimProfile {
  /** Name the report prints. Not shown to anyone in the app. */
  id: string;
  /** Share of the period's chores they finish, 0…1. Rounded to whole chores. */
  taskShare: number;
  /** Catalogue ids they buy every period, in this order. Needs first. */
  buys: readonly string[];
  /** Share of what the shopping leaves that goes into the jar, 0…1. */
  saveShare: number;
}

/** What one period of a run came to. */
interface SimPeriod {
  /** Period number as the save counts them — the first one is 1. */
  index: number;
  /** Coins credited during the period, the regularity bonus included. */
  earned: number;
  /** Coins spent on `need` items. */
  spentNeeds: number;
  /** Coins spent on `want` items. */
  spentWants: number;
  /** Coins moved into a jar. */
  saved: number;
  /** Balance once the period is settled — never below zero, 2.5.6. */
  balance: number;
  /** Whether the fact stayed inside the plan in all three directions. */
  isPlanKept: boolean;
  /** Whether every item the profile meant to buy was affordable. */
  isShoppingDone: boolean;
  /** Purchases the wallet refused for want of coins. */
  refusals: number;
}

/** The whole run, and the answers a balance question is actually asked of. */
interface SimRun {
  /** The profile that was played. */
  profile: SimProfile;
  /** The save at the end, for anything the summary below does not carry. */
  user: UserSave;
  /** One row per finished period, in order. */
  periods: SimPeriod[];
  /** Lowest balance seen at any point of the run. */
  minBalance: number;
  /** Which period each goal was reached in — the map is missing the unreached. */
  goalsReachedIn: Record<string, number>;
  /** The stage the pet grew to over the run. */
  stage: UserSave['pet']['stage'];
}

interface SimOptions {
  /** How many periods to play. The demo run's five by default — 2.5.13. */
  periods?: number;
  /**
   * Save to carry on from, in the `planning` phase. A fresh profile by
   * default; passing the end of another run asks whether a child can climb
   * back out of where that run left them.
   */
  start?: UserSave;
  /** Clock the run stamps history with. A fresh demo clock by default. */
  time?: TimeSource & { tick: () => void };
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * The chores this profile finishes, in catalogue order.
 *
 * Whole chores only: half a chore pays nothing, and a share that rounds to
 * zero means a child who did none — which is a scenario worth running, not an
 * error.
 */
const choresFor = (profile: SimProfile): readonly string[] => {
  const all = listTasks();
  return all
    .slice(0, Math.round(profile.taskShare * all.length))
    .map((t) => t.id);
};

/**
 * What the chores the child means to do will pay.
 *
 * Part of what they have to allocate: the coins are not in the wallet yet when
 * the plan is written, but a plan that ignores them would budget only the
 * leftovers of the last period.
 */
const expectedIncome = (profile: SimProfile): number =>
  choresFor(profile)
    .map((id) => listTasks().find((task) => task.id === id))
    .reduce((sum, task) => sum + (task ? rewardForTask(task) : 0), 0);

/**
 * The plan this profile writes down, out of what docs/budget.md calls
 * "доступно к плану" — the balance on entering the planning phase, plus what
 * the period's chores are going to pay.
 *
 * `buys` is the intent, so its cost is the needs and wants lines; heating is
 * the fixed need `endPeriod` will bill (0.3-R / docs/house.md), so it belongs
 * on the needs line too — otherwise every period that keeps the thermostat
 * above the free base would look like a broken plan. Whatever is left over
 * goes on the savings line at the profile's rate. A profile whose shopping
 * outgrows its plan is the one that breaks it — see `impulsive` in the tests.
 */
const planFor = (
  user: UserSave,
  profile: SimProfile,
): UserSave['period']['plan'] => {
  let needs = 0;
  let wants = 0;

  for (const itemId of profile.buys) {
    const item = getCatalogueItem(itemId);
    if (!item) continue;
    if (item.kind === 'need') needs += item.price;
    else wants += item.price;
  }

  // Settlement bills heating once per period index — plan for it here.
  if (user.home.lastBilledPeriod !== user.period.index) {
    needs += buildBill(user.home.temperature, user.home.insulationIds).total;
  }

  const available = user.wallet.balance + expectedIncome(profile);
  const spare = Math.max(0, available - needs - wants);

  return { needs, wants, savings: Math.floor(spare * profile.saveShare) };
};

/** The nearest goal still short of its price, or `null` when all are full. */
const nextOpenGoalId = (user: UserSave): string | null =>
  user.savings.goals.find((row) => {
    const goal = getGoalById(row.goalId);
    return goal ? row.saved < goal.price : false;
  })?.goalId ?? null;

/** How many coins one goal still has room for. */
const roomFor = (user: UserSave, goalId: string): number => {
  const goal = getGoalById(goalId);
  const row = user.savings.goals.find((entry) => entry.goalId === goalId);
  return goal && row ? goal.price - row.saved : 0;
};

/**
 * Puts `budget` coins away, filling the nearest goal and then looking at the
 * next one.
 *
 * A deposit larger than the goal's room is refused outright, so the split is
 * worked out here — the same thing the jar screen does when the child drags
 * past the top of the bar.
 */
const putAside = (
  user: UserSave,
  budget: number,
  time: TimeSource,
): { user: UserSave; saved: number } => {
  let next = user;
  let left = budget;
  let saved = 0;

  while (left > 0) {
    const goalId = nextOpenGoalId(next);
    if (!goalId) break;

    if (next.savings.activeGoalId !== goalId) {
      const picked = setActiveGoal(next, goalId);
      if (!picked.ok) break;
      next = picked.user;
    }

    const amount = Math.min(left, roomFor(next, goalId));
    if (amount <= 0) break;

    const result = applyDeposit(next, goalId, amount, time);
    if (!result.ok) break;

    next = result.user;
    saved += amount;
    left -= amount;
  }

  return { user: next, saved };
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Plays one imagined child through several periods and reports what the
 * balance table did to them.
 *
 * Everything runs through the real appliers — `applyCompleteTask`,
 * `applyPurchase`, `applyDeposit` and the period machine — so the run answers
 * for the shipped rules rather than for a second copy of the formulas that
 * would quietly drift from them. Nothing here reads the clock or the store:
 * the same profile always produces the same run.
 *
 * See docs/economy.md §Симуляция баланса for what the numbers must come to.
 */
export const simulate = (
  profile: SimProfile,
  {
    periods = DEMO_RUN_PERIODS,
    start = createInitialUser({ playerName: profile.id, createdAt: 0 }),
    time = makeDemoTimeSource(0),
  }: SimOptions = {},
): SimRun => {
  let user = start;
  const rows: SimPeriod[] = [];
  const goalsReachedIn: Record<string, number> = {};
  let minBalance = user.wallet.balance;

  const watchBalance = () => {
    minBalance = Math.min(minBalance, user.wallet.balance);
  };

  for (let played = 0; played < periods; played += 1) {
    const index = user.period.index;

    user = startPeriod({
      ...user,
      period: { ...user.period, plan: planFor(user, profile) },
    });

    let earned = 0;
    for (const taskId of choresFor(profile)) {
      const done = applyCompleteTask(user, taskId, time);
      if (!done.ok) continue;
      user = done.user;
      earned += done.reward;
      time.tick();
    }

    let spentNeeds = 0;
    let spentWants = 0;
    let refusals = 0;
    for (const itemId of profile.buys) {
      const bought = applyPurchase(user, itemId, time);
      if (!bought.ok) {
        refusals += 1;
        continue;
      }
      user = bought.user;
      if (bought.item.kind === 'need') spentNeeds += bought.item.price;
      else spentWants += bought.item.price;
      watchBalance();
      time.tick();
    }

    const upcomingBill =
      user.home.lastBilledPeriod === user.period.index
        ? 0
        : buildBill(user.home.temperature, user.home.insulationIds).total;
    // Leave the heating coins in the wallet — settlement will take them, and
    // saving them first would push fact.savings over a plan that already
    // reserved that bill on the needs line.
    const put = putAside(
      user,
      Math.floor(
        Math.max(0, user.wallet.balance - upcomingBill) * profile.saveShare,
      ),
      time,
    );
    user = put.user;
    watchBalance();
    time.tick();

    user = finishPeriod(user);

    // The bonus is read off the settlement rather than restated here: the rule
    // for it lives in `endPeriod`, and a second copy would drift.
    const beforeSettlement = user.wallet.balance;
    user = endPeriod(user);
    earned += user.wallet.balance - beforeSettlement;
    watchBalance();

    const record = user.history[user.history.length - 1];
    for (const goalId of record?.reachedGoalIds ?? []) {
      goalsReachedIn[goalId] ??= index;
    }

    rows.push({
      index,
      earned,
      spentNeeds,
      spentWants,
      saved: put.saved,
      balance: user.wallet.balance,
      isPlanKept: record?.isPlanKept ?? false,
      isShoppingDone: refusals === 0,
      refusals,
    });
  }

  return {
    profile,
    user,
    periods: rows,
    minBalance,
    goalsReachedIn,
    stage: user.pet.stage,
  };
};

export type { SimOptions, SimPeriod, SimProfile, SimRun };
