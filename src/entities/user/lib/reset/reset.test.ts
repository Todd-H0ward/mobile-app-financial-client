import { describe, expect, it } from 'vitest';

import type { UserSave } from '../../model';
import { createInitialUser } from '../../model';

import { resetUser } from './reset';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A profile mid-way through period four: a reset has something to lose. */
const playedProfile = (): UserSave => {
  const user = createInitialUser({
    playerName: 'Аня',
    createdAt: 1000,
    pet: {
      species: 'capybara',
      color: 'mint',
      pattern: 'stripes',
      name: 'Кекс',
    },
  });

  return {
    ...user,
    pet: { ...user.pet, stage: 'teen', comfort: 0.4, spirit: 0.9 },
    wallet: {
      balance: 137,
      history: [
        {
          id: '1',
          source: 'task:change-counting',
          amount: 18,
          kind: 'earn',
          direction: null,
          periodIndex: 3,
          at: 2000,
        },
      ],
    },
    savings: {
      ...user.savings,
      goals: user.savings.goals.map((goal) => ({ ...goal, saved: 40 })),
      depositsThisPeriod: 2,
    },
    period: { ...user.period, index: 4, phase: 'active' },
    history: [
      {
        index: 3,
        plan: { needs: 60, wants: 25, savings: 30 },
        fact: { needs: 58, wants: 40, savings: 15 },
        isPlanKept: false,
        reachedGoalIds: [],
        endedAt: 3000,
      },
    ],
    home: {
      temperature: 0.8,
      insulationIds: ['window'],
      furnitureIds: ['rug'],
      lastBilledPeriod: 3,
    },
    settings: { ...user.settings, isSoundEnabled: false, isDemoMode: true },
  };
};

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('resetUser', () => {
  it('returns exactly the starting state for the same child and pet', () => {
    const user = playedProfile();

    expect(resetUser(user)).toEqual(
      createInitialUser({
        playerName: 'Аня',
        createdAt: 1000,
        settings: user.settings,
        pet: {
          species: 'capybara',
          color: 'mint',
          pattern: 'stripes',
          name: 'Кекс',
        },
      }),
    );
  });

  it('keeps who the child is: name, pet name and appearance', () => {
    const reset = resetUser(playedProfile());

    expect(reset.playerName).toBe('Аня');
    expect(reset.pet.name).toBe('Кекс');
    expect(reset.pet.species).toBe('capybara');
    expect(reset.pet.color).toBe('mint');
    expect(reset.pet.pattern).toBe('stripes');
  });

  it('keeps what the grown-up configured', () => {
    const reset = resetUser(playedProfile());

    expect(reset.settings.isSoundEnabled).toBe(false);
    expect(reset.settings.isDemoMode).toBe(true);
  });

  it('clears the progress: wallet, savings, home, history and the period', () => {
    const reset = resetUser(playedProfile());

    expect(reset.wallet.history).toEqual([]);
    expect(reset.savings.goals.every((goal) => goal.saved === 0)).toBe(true);
    expect(reset.savings.depositsThisPeriod).toBe(0);
    expect(reset.history).toEqual([]);
    expect(reset.home.insulationIds).toEqual([]);
    expect(reset.home.lastBilledPeriod).toBe(0);
    expect(reset.period.index).toBe(1);
    expect(reset.period.phase).toBe('planning');
    expect(reset.pet.stage).toBe('baby');
  });

  it('does not mutate the user it was given', () => {
    const user = playedProfile();
    const snapshot = structuredClone(user);

    resetUser(user);

    expect(user).toEqual(snapshot);
  });
});
