import { describe, expect, it } from 'vitest';

import { MODULE_PRICE } from '@/entities/economy';

import { createInitialUser } from '../../model/initial-user';
import { applyIdentity } from '../identity';

import { installModule } from './workshop';

const active = () => {
  const user = createInitialUser();
  return { ...user, period: { ...user.period, phase: 'active' as const } };
};
describe('paid workshop', () => {
  it('buys once, charges wants, and preserves savings and platform', () => {
    const before = active();
    const bought = installModule(before, 'head', 2, 100);
    expect(bought.reason).toBe('purchased');
    expect(bought.user.wallet.balance).toBe(
      before.wallet.balance - MODULE_PRICE,
    );
    expect(bought.user.period.fact.wants).toBe(MODULE_PRICE);
    expect(bought.user.savings).toBe(before.savings);
    expect(bought.user.platform).toBe(before.platform);
    expect(installModule(bought.user, 'head', 2, 101).user).toBe(bought.user);
    const swapped = installModule(bought.user, 'head', 0, 102);
    expect(swapped.reason).toBe('installed');
    expect(swapped.user.wallet).toBe(bought.user.wallet);
    expect(installModule(swapped.user, 'head', 2, 103).user.wallet).toBe(
      bought.user.wallet,
    );
  });
  it('does not spend in planning, without funds or on malformed module IDs', () => {
    expect(installModule(createInitialUser(), 'body', 1, 0).reason).toBe(
      'planning',
    );
    const user = active();
    user.wallet = { ...user.wallet, balance: 0 };
    expect(installModule(user, 'body', 1, 0)).toEqual({
      user,
      reason: 'funds',
    });
    expect(installModule(user, 'legs', 3, 0)).toEqual({
      user,
      reason: 'invalid',
    });
  });
  it('grants initial selections but cannot buy modules through name editing', () => {
    const initial = createInitialUser();
    const named = applyIdentity(initial, {
      playerName: 'Аня',
      robotName: 'Финни',
      skin: 'factory',
      assembly: { head: 2, body: 1, legs: 2 },
    });
    expect(named.ownedItemIds).toContain('module:head:2');
    expect(named.wallet).toBe(initial.wallet);
    expect(
      applyIdentity(named, {
        playerName: 'Аня',
        robotName: 'Финни',
        skin: 'factory',
        assembly: { head: 1, body: 1, legs: 2 },
      }),
    ).toBe(named);
  });
});
