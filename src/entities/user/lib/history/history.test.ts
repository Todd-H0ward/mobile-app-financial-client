import { describe, expect, it } from 'vitest';

import { WALLET_SOURCES } from '@/entities/economy';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';

import {
  describeWalletSource,
  getLastPeriod,
  listPeriodHistory,
  listWalletHistory,
} from './history';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const withHistory = (): UserSave => {
  const user = createInitialUser({ playerName: 'Саша', createdAt: 0 });
  return {
    ...user,
    history: [
      {
        index: 1,
        plan: { needs: 20, wants: 10, savings: 10 },
        fact: { needs: 18, wants: 12, savings: 10 },
        isPlanKept: false,
        reachedGoalIds: [],
        endedAt: 1000,
        earned: 0,
        adjustment: -5,
        robotCharge: 0.7,
        robotSpirit: 0.7,
      },
      {
        index: 2,
        plan: { needs: 20, wants: 10, savings: 10 },
        fact: { needs: 20, wants: 10, savings: 10 },
        isPlanKept: true,
        reachedGoalIds: ['paints'],
        endedAt: 2000,
        earned: 18,
        adjustment: 5,
        robotCharge: 0.8,
        robotSpirit: 0.8,
      },
    ],
    wallet: {
      ...user.wallet,
      history: [
        {
          id: 'e2',
          source: 'purchase:bread',
          amount: 8,
          kind: 'spend',
          direction: 'needs',
          periodIndex: 2,
          at: 1500,
        },
        {
          id: 'e1',
          source: WALLET_SOURCES.startingWallet,
          amount: 50,
          kind: 'earn',
          direction: null,
          periodIndex: 1,
          at: 0,
        },
      ],
    },
  };
};

// ═══════════════════════════════════════════
describe('listPeriodHistory / getLastPeriod', () => {
  it('returns newest finished period first', () => {
    const user = withHistory();
    expect(listPeriodHistory(user).map((row) => row.index)).toEqual([2, 1]);
    expect(getLastPeriod(user)?.index).toBe(2);
  });

  it('returns null before any settlement', () => {
    expect(getLastPeriod(createInitialUser())).toBeNull();
    expect(listPeriodHistory(createInitialUser())).toEqual([]);
  });
});

describe('describeWalletSource', () => {
  it('names rule sources and content-backed ones', () => {
    expect(describeWalletSource(WALLET_SOURCES.startingWallet)).toEqual({
      kind: 'startingWallet',
    });
    expect(describeWalletSource(WALLET_SOURCES.gamePuzzle)).toEqual({
      kind: 'gamePuzzle',
    });
    expect(describeWalletSource(WALLET_SOURCES.gameSpacewar)).toEqual({
      kind: 'gameSpacewar',
    });
    expect(describeWalletSource(WALLET_SOURCES.gameSnake)).toEqual({
      kind: 'gameSnake',
    });
    expect(describeWalletSource('purchase:bread').kind).toBe('purchase');
    expect(describeWalletSource('task:change-counting').kind).toBe('task');
    expect(describeWalletSource('savings:deposit:paints').kind).toBe(
      'savingsDeposit',
    );
    expect(describeWalletSource('mystery').kind).toBe('unknown');
  });
});

describe('listWalletHistory', () => {
  it('keeps newest-first order and attaches labels', () => {
    const rows = listWalletHistory(withHistory());
    expect(rows[0]?.entry.id).toBe('e2');
    expect(rows[0]?.source.kind).toBe('purchase');
    expect(rows[1]?.source.kind).toBe('startingWallet');
  });
});
