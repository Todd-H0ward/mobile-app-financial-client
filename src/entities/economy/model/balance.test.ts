import { describe, expect, it } from 'vitest';

import { GAME_REWARDS } from '@/entities/minigame';

import {
  BUDGET_TOLERANCE,
  HEATING,
  PERIOD_HISTORY_LIMIT,
  PERIOD_NEED_DECAY,
  REGULARITY_BONUS,
  STARTING_BALANCE,
  TASK_REWARD,
  WALLET_HISTORY_LIMIT,
  WALLET_SOURCES,
} from './balance';
import { BUDGET_DIRECTIONS } from './directions';

// ═══════════════════════════════════════════
// BALANCE TABLE
// ═══════════════════════════════════════════

describe('economy balance table', () => {
  it('keeps starting wallet and history caps positive', () => {
    expect(STARTING_BALANCE).toBeGreaterThan(0);
    expect(WALLET_HISTORY_LIMIT).toBeGreaterThan(0);
    expect(PERIOD_HISTORY_LIMIT).toBeGreaterThan(0);
    expect(REGULARITY_BONUS).toBeGreaterThan(0);
  });

  it('names every built-in wallet source', () => {
    expect(WALLET_SOURCES.startingWallet).toMatch(/^wallet:/);
    expect(WALLET_SOURCES.regularityBonus).toMatch(/^bonus:/);
    expect(WALLET_SOURCES.heatingBill).toMatch(/^bill:/);
    expect(WALLET_SOURCES.gamePuzzle).toMatch(/^game:/);
  });

  it('exposes the three budget directions', () => {
    expect([...BUDGET_DIRECTIONS]).toEqual(['needs', 'wants', 'savings']);
    expect(BUDGET_TOLERANCE).toBe(0);
  });

  it('keeps heating knobs in range', () => {
    expect(HEATING.freeTemperature).toBeGreaterThanOrEqual(0);
    expect(HEATING.freeTemperature).toBeLessThan(1);
    expect(HEATING.coinsPerTenth).toBeGreaterThan(0);
    expect(HEATING.insulationDiscount).toBeGreaterThan(0);
  });

  it('decays needs only on settlement, never past 1', () => {
    expect(PERIOD_NEED_DECAY.comfort).toBeGreaterThan(0);
    expect(PERIOD_NEED_DECAY.spirit).toBeGreaterThan(0);
    expect(PERIOD_NEED_DECAY.comfort).toBeLessThan(1);
    expect(PERIOD_NEED_DECAY.spirit).toBeLessThan(1);
  });
});

describe('chores out-earn games — AGENTS.md arcade', () => {
  it('keeps every game reward under a medium chore', () => {
    const mediumChore = TASK_REWARD.medium;
    for (const [game, reward] of Object.entries(GAME_REWARDS)) {
      expect(reward, `${game} must pay less than a medium chore`).toBeLessThan(
        mediumChore,
      );
    }
  });

  it('keeps easy chores at or above the richest game', () => {
    const richestGame = Math.max(...Object.values(GAME_REWARDS));
    expect(TASK_REWARD.easy).toBeGreaterThanOrEqual(richestGame);
  });
});
