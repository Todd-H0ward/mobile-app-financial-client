import { describe, expect, it } from 'vitest';

import { listCatalogue } from '@/entities/catalogue';

import { type SimProfile, simulate } from './simulate';

// ═══════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════

/**
 * Everything the shop calls mandatory, read from content rather than listed
 * here: a need added to the catalogue must raise the bar these runs clear,
 * not slip past a hardcoded basket.
 */
const NEEDS = listCatalogue()
  .filter((item) => item.kind === 'need')
  .map((item) => item.id);

/** The cheapest optional thing — what a saving child treats themselves to. */
const CHEAPEST_WANT = [...listCatalogue()]
  .filter((item) => item.kind === 'want')
  .sort((a, b) => a.price - b.price)[0].id;

/** The dearest one — what an unsaving child spends the period on instead. */
const DEAREST_WANT = [...listCatalogue()]
  .filter((item) => item.kind === 'want')
  .sort((a, b) => b.price - a.price)[0].id;

/** Does every chore, covers the needs, treats themselves once, saves the rest. */
const DILIGENT: SimProfile = {
  id: 'diligent',
  taskShare: 1,
  buys: [...NEEDS, CHEAPEST_WANT],
  saveShare: 0.8,
};

/** Half the chores — a busy week that must not break the game. */
const TYPICAL: SimProfile = {
  id: 'typical',
  taskShare: 0.5,
  buys: NEEDS,
  saveShare: 0.5,
};

/** One chore in six: the floor the balance table has to answer for. */
const BUSY: SimProfile = {
  id: 'busy',
  taskShare: 0.15,
  buys: NEEDS,
  saveShare: 0.5,
};

/** Earns plenty and spends it on wants — planned spending, almost no saving. */
const IMPULSIVE: SimProfile = {
  id: 'impulsive',
  taskShare: 1,
  buys: [...NEEDS, DEAREST_WANT],
  saveShare: 0.2,
};

const ALL_PROFILES = [DILIGENT, TYPICAL, BUSY, IMPULSIVE];

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('simulate', () => {
  it('plays the demo run of five periods by default', () => {
    expect(simulate(DILIGENT).periods).toHaveLength(5);
  });

  it('is deterministic — the same profile gives the same run', () => {
    expect(simulate(TYPICAL).periods).toEqual(simulate(TYPICAL).periods);
  });
});

describe('the balance table: a child who does every chore', () => {
  const run = simulate(DILIGENT);

  it('covers the mandatory basket every period', () => {
    for (const period of run.periods) {
      expect(period.spentNeeds).toBe(
        NEEDS.reduce(
          (sum, id) =>
            sum + (listCatalogue().find((item) => item.id === id)?.price ?? 0),
          0,
        ),
      );
      expect(period.refusals).toBe(0);
    }
  });

  it('reaches the main goal in two to four periods', () => {
    // docs/economy.md: "не тривиально и не безнадёжно". The scooter is the
    // mandatory scenario's goal, and content/goals.json promises 3–4 periods.
    expect(run.goalsReachedIn.scooter).toBeGreaterThanOrEqual(2);
    expect(run.goalsReachedIn.scooter).toBeLessThanOrEqual(4);
  });

  it('keeps the plan every period', () => {
    expect(run.periods.every((period) => period.isPlanKept)).toBe(true);
  });

  it('builds the robot all the way inside the five periods', () => {
    // 2.5.10 asks for stages a child can actually see reached, not stages a
    // save can in principle hold.
    expect(run.stage).toBe('complete');
  });
});

describe('the balance table: half the chores', () => {
  const run = simulate(TYPICAL);

  it('still pays for the mandatory basket every period', () => {
    expect(run.periods.every((period) => period.isShoppingDone)).toBe(true);
  });

  it('never runs the wallet dry', () => {
    // A busy week costs progress, never the ability to act next period.
    expect(run.periods.every((period) => period.balance > 0)).toBe(true);
  });

  it('leaves coins over for something optional', () => {
    const cheapest = listCatalogue().find((item) => item.id === CHEAPEST_WANT);
    for (const period of run.periods) {
      expect(period.balance).toBeGreaterThanOrEqual(cheapest?.price ?? 0);
    }
  });

  it('reaches the first goal and upgrades the robot once', () => {
    expect(run.goalsReachedIn.paints).toBeLessThanOrEqual(5);
    expect(run.stage).toBe('upgraded');
  });
});

describe('the balance table: one chore in six', () => {
  const run = simulate(BUSY);

  it('puts every goal out of reach', () => {
    // docs/economy.md: "усилие обязано иметь значение".
    expect(run.goalsReachedIn).toEqual({});
    expect(run.stage).toBe('basic');
  });

  it('is not a dead end — one diligent period buys the basket again', () => {
    const recovery = simulate(DILIGENT, { periods: 1, start: run.user });

    expect(recovery.periods[0].isShoppingDone).toBe(true);
    expect(recovery.periods[0].refusals).toBe(0);
  });
});

describe('the balance table: spending instead of saving', () => {
  const run = simulate(IMPULSIVE);

  it('never reaches the main goal, on the same income as the diligent run', () => {
    // The lesson of the jar: what separates this run from the diligent one is
    // where the coins went, not how many were earned — both do every chore.
    expect(run.goalsReachedIn.scooter).toBeUndefined();
    expect(run.periods.every((period) => period.isShoppingDone)).toBe(true);
  });

  it('is at least two periods behind on the first goal', () => {
    const diligent = simulate(DILIGENT);

    expect(run.goalsReachedIn.paints).toBeGreaterThanOrEqual(
      diligent.goalsReachedIn.paints + 2,
    );
  });

  it('counts as a kept plan — spending inside a plan is not a mistake', () => {
    expect(run.periods.every((period) => period.isPlanKept)).toBe(true);
  });
});

describe('the balance table: every profile', () => {
  it('never goes below zero', () => {
    // 2.5.6. The wallet refuses rather than borrows, so a run that dipped
    // would mean a hole in `debitWallet`, not an unlucky profile.
    for (const profile of ALL_PROFILES) {
      expect(simulate(profile).minBalance).toBeGreaterThanOrEqual(0);
    }
  });

  it('names every coin it ever credits', () => {
    // 2.5.4: a nameless credit is a bug the report cannot explain away.
    for (const profile of ALL_PROFILES) {
      const { history } = simulate(profile).user.wallet;
      expect(history.every((entry) => entry.source.length > 0)).toBe(true);
    }
  });
});
