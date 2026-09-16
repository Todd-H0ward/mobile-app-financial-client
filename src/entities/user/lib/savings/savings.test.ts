import { describe, expect, it } from 'vitest';

import { STARTING_BALANCE } from '@/entities/economy';
import { getGoalById } from '@/entities/goal';

import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';
import { creditWallet } from '../wallet';

import { applyDeposit, applyWithdraw, setActiveGoal } from './savings';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const activeUser = (time = makeDemoTimeSource()): UserSave => {
  const user = createInitialUser({
    playerName: 'Саша',
    createdAt: time.now(),
  });
  return {
    ...user,
    period: { ...user.period, phase: 'active' },
  };
};

// ═══════════════════════════════════════════
describe('applyDeposit', () => {
  it('moves coins into the jar and bumps fact.savings', () => {
    const time = makeDemoTimeSource();
    const user = activeUser(time);
    const result = applyDeposit(user, 'paints', 20, time);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user.wallet.balance).toBe(STARTING_BALANCE - 20);
    expect(
      result.user.savings.goals.find((g) => g.goalId === 'paints')?.saved,
    ).toBe(20);
    expect(result.user.savings.depositsThisPeriod).toBe(1);
    expect(result.user.period.fact.savings).toBe(20);
  });

  it('marks the goal reached when the jar fills', () => {
    const paints = getGoalById('paints');
    expect(paints).toBeDefined();
    if (!paints) return;

    const time = makeDemoTimeSource();
    let user = activeUser(time);
    user = {
      ...user,
      wallet: creditWallet(user.wallet, {
        source: 'task:top-up',
        amount: 20,
        direction: null,
        periodIndex: 1,
        at: time.now(),
      }),
    };

    const result = applyDeposit(user, 'paints', paints.price, time);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const row = result.user.savings.goals.find((g) => g.goalId === 'paints');
    expect(row?.saved).toBe(paints.price);
    expect(row?.reachedInPeriod).toBe(1);
  });

  it('refuses a deposit outside the active phase', () => {
    const time = makeDemoTimeSource();
    const user = createInitialUser({
      playerName: 'Саша',
      createdAt: time.now(),
    });
    expect(applyDeposit(user, 'paints', 10, time).ok).toBe(false);
  });

  it('refuses more than the wallet holds', () => {
    const time = makeDemoTimeSource();
    const user = activeUser(time);
    const result = applyDeposit(user, 'scooter', STARTING_BALANCE + 1, time);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('insufficient_funds');
    expect(result.shortfall).toBe(1);
  });
});

describe('applyWithdraw', () => {
  it('returns coins to the wallet and lowers fact.savings', () => {
    const time = makeDemoTimeSource();
    let user = activeUser(time);
    const deposited = applyDeposit(user, 'paints', 30, time);
    expect(deposited.ok).toBe(true);
    if (!deposited.ok) return;
    user = deposited.user;

    const result = applyWithdraw(user, 'paints', 12, time);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user.wallet.balance).toBe(STARTING_BALANCE - 30 + 12);
    expect(
      result.user.savings.goals.find((g) => g.goalId === 'paints')?.saved,
    ).toBe(18);
    expect(result.user.period.fact.savings).toBe(18);
  });

  it('refuses a take larger than the jar', () => {
    const time = makeDemoTimeSource();
    const user = activeUser(time);
    const result = applyWithdraw(user, 'paints', 5, time);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('insufficient_saved');
  });
});

describe('setActiveGoal', () => {
  it('switches the home focus goal', () => {
    const user = activeUser();
    const result = setActiveGoal(user, 'scooter');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.savings.activeGoalId).toBe('scooter');
  });
});
