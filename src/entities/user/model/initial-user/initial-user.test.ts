import { describe, expect, it } from 'vitest';

import { STARTING_BALANCE, WALLET_SOURCES } from '@/entities/economy';

import { createInitialUser, USER_SAVE_VERSION } from './initial-user';

import GOALS_CONTENT from '@/content/goals.json';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('createInitialUser', () => {
  it('opens the game on the first period, in planning', () => {
    const user = createInitialUser();

    expect(user.version).toBe(USER_SAVE_VERSION);
    expect(user.period.index).toBe(1);
    expect(user.period.phase).toBe('planning');
    expect(user.period.plan).toEqual({ needs: 0, wants: 0, savings: 0 });
    expect(user.period.fact).toEqual({ needs: 0, wants: 0, savings: 0 });
  });

  it('hands out the starting wallet, named — 2.5.4 bans a nameless credit', () => {
    const user = createInitialUser();

    expect(user.wallet.balance).toBe(STARTING_BALANCE);
    expect(user.wallet.history).toEqual([
      expect.objectContaining({
        source: WALLET_SOURCES.startingWallet,
        amount: STARTING_BALANCE,
        kind: 'earn',
        direction: null,
      }),
    ]);
    expect(user.wallet.entryCount).toBe(1);
    expect(user.history).toEqual([]);
  });

  it('seeds the goals from the content file, all at zero — 2.5.7 asks for three', () => {
    const user = createInitialUser();

    expect(user.savings.goals.length).toBeGreaterThanOrEqual(3);
    expect(user.savings.goals.map((goal) => goal.goalId)).toEqual(
      GOALS_CONTENT.goals.map((goal) => goal.id),
    );
    expect(user.savings.goals.every((goal) => goal.saved === 0)).toBe(true);
    expect(user.savings.activeGoalId).toBe(GOALS_CONTENT.goals[0]?.id);
  });

  it('issues the first catalogue chore with nothing done yet — 2.5.8', () => {
    const user = createInitialUser();

    expect(user.tasks.activeTaskId).not.toBeNull();
    expect(user.tasks.completedThisPeriod).toEqual([]);
  });

  it('stores only the goal id — the title and the price stay in content, 3.2', () => {
    const [goal] = createInitialUser().savings.goals;

    expect(Object.keys(goal ?? {})).toEqual([
      'goalId',
      'saved',
      'reachedInPeriod',
    ]);
  });

  it('takes the identity from the onboarding input', () => {
    const user = createInitialUser({
      playerName: 'Аня',
      createdAt: 1700000000000,
      pet: {
        species: 'dog',
        color: 'graphite',
        pattern: 'spots',
        name: 'Кекс',
      },
    });

    expect(user.playerName).toBe('Аня');
    expect(user.createdAt).toBe(1700000000000);
    expect(user.period.phaseEnteredAt).toBe(1700000000000);
    expect(user.pet.species).toBe('dog');
    expect(user.pet.name).toBe('Кекс');
    expect(user.pet.stage).toBe('baby');
  });

  it('does not read the system clock: the same input gives the same user', () => {
    expect(createInitialUser({ createdAt: 5 })).toEqual(
      createInitialUser({ createdAt: 5 }),
    );
  });
});

describe('content/goals.json', () => {
  it('holds at least three goals with an id, a title and a price', () => {
    expect(GOALS_CONTENT.goals.length).toBeGreaterThanOrEqual(3);

    for (const goal of GOALS_CONTENT.goals) {
      expect(typeof goal.id).toBe('string');
      expect(goal.id.length).toBeGreaterThan(0);
      expect(typeof goal.title).toBe('string');
      expect(goal.price).toBeGreaterThan(0);
      expect(Number.isInteger(goal.price)).toBe(true);
    }
  });

  it('has no duplicate ids — the save addresses a goal by id and nothing else', () => {
    const ids = GOALS_CONTENT.goals.map((goal) => goal.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
