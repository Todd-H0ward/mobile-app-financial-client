import { describe, expect, it } from 'vitest';

import type { GameId } from '@/entities/minigame';

import { createInitialUser, USER_SAVE_VERSION } from '../../model/initial-user';
import { migrateUser } from '../../model/migrations';
import type { UserSave } from '../../model/types';
import { startPeriod } from '../period';

import { beginArcadeSession, completeArcadeSession } from './arcade';

const DAY = 86_400_000;
const activeUser = () => {
  const user = createInitialUser();
  return startPeriod({
    ...user,
    period: { ...user.period, plan: { needs: 10, wants: 10, savings: 10 } },
  });
};
const play = (user: UserSave, gameId: GameId = 'snake', at = DAY) => {
  const started = beginArcadeSession(user, gameId);
  return completeArcadeSession(started, started.arcade.sequence, gameId, {
    now: () => at,
  });
};

describe('durable arcade payouts', () => {
  it('shares three paid sittings across games, then allows unpaid practice', () => {
    let user = activeUser();
    const before = user.wallet.balance;
    for (const game of ['puzzle', 'snake', 'spacewar'] as const) {
      const result = play(user, game);
      expect(result.coins).toBeGreaterThan(0);
      user = result.user;
    }
    expect(user.wallet.balance).toBe(before + 22);
    expect(user.arcade.paidCount).toBe(3);
    const practice = play(user);
    expect(practice.reason).toBe('limit');
    expect(practice.coins).toBe(0);
    expect(practice.user.wallet).toBe(user.wallet);
    expect(practice.user.arcade.active).toBeNull();
  });

  it('consumes a session once across saving and restoring the profile', () => {
    const started = beginArcadeSession(activeUser(), 'snake');
    const restored = migrateUser(
      JSON.parse(JSON.stringify(started)),
      USER_SAVE_VERSION,
    );
    if (!restored) throw new Error('Cannot restore');
    const first = completeArcadeSession(
      restored,
      started.arcade.sequence,
      'snake',
      { now: () => DAY },
    );
    const reloaded = migrateUser(
      JSON.parse(JSON.stringify(first.user)),
      USER_SAVE_VERSION,
    );
    if (!reloaded) throw new Error('Cannot restore');
    const duplicate = completeArcadeSession(
      reloaded,
      started.arcade.sequence,
      'snake',
      { now: () => DAY * 2 },
    );
    expect(duplicate.reason).toBe('duplicate');
    expect(duplicate.user).toBe(reloaded);
    expect(duplicate.coins).toBe(0);
  });

  it('records the score and reward in one consumed session, never twice', () => {
    const user = beginArcadeSession(activeUser(), 'snake');
    const result = completeArcadeSession(
      user,
      user.arcade.sequence,
      'snake',
      { now: () => DAY },
      7,
    );
    expect(result.user.arcade.scores.snake).toEqual([7]);
    const repeat = completeArcadeSession(
      result.user,
      user.arcade.sequence,
      'snake',
      { now: () => DAY },
      99,
    );
    expect(repeat.user.arcade.scores.snake).toEqual([7]);
    expect(repeat.user.wallet).toBe(result.user.wallet);
  });

  it('does not let a callback from an abandoned game claim the new session', () => {
    const first = beginArcadeSession(activeUser(), 'snake');
    const second = beginArcadeSession(first, 'spacewar');
    expect(
      completeArcadeSession(second, first.arcade.sequence, 'snake', {
        now: () => DAY,
      }).reason,
    ).toBe('duplicate');
    expect(
      completeArcadeSession(second, second.arcade.sequence, 'snake', {
        now: () => DAY,
      }).reason,
    ).toBe('duplicate');
  });

  it('does not refill the allowance on restart or moving the clock backwards', () => {
    let user = activeUser();
    for (let i = 0; i < 3; i++) user = play(user, 'snake', DAY * 3).user;
    const restored = migrateUser(
      JSON.parse(JSON.stringify(user)),
      USER_SAVE_VERSION,
    );
    if (!restored) throw new Error('Cannot restore');
    expect(play(restored, 'snake', DAY).reason).toBe('limit');
    expect(play(restored, 'snake', DAY * 4).reason).toBe('paid');
    expect(play(restored, 'snake', DAY * 4).user.arcade.paidCount).toBe(1);
  });

  it('keeps games open without paying before a budget is confirmed', () => {
    const result = play(createInitialUser());
    expect(result.reason).toBe('planning');
    expect(result.coins).toBe(0);
    expect(result.user.arcade.paidCount).toBe(0);
  });

  it('migrates v7 without changing any earned money or platform progress', () => {
    const { arcade: _, ...old } = activeUser();
    const migrated = migrateUser({ ...old, version: 7 }, 7);
    expect(migrated?.wallet).toEqual(old.wallet);
    expect(migrated?.platform).toEqual(old.platform);
    expect(migrated?.arcade).toEqual({
      sequence: 0,
      active: null,
      paidDay: -1,
      paidWeek: -1,
      paidCount: 0,
      scores: { snake: [], spacewarMs: [] },
    });
  });
});

describe('weekly arcade calendar', () => {
  it('pays a partial reward on mistakes, once per week across restarts and clock rollback', () => {
    const monday = Date.UTC(2026, 8, 21);
    const started = beginArcadeSession(activeUser(), 'weekly');
    const result = completeArcadeSession(
      started,
      started.arcade.sequence,
      'weekly',
      { now: () => monday },
      undefined,
      false,
    );
    expect(result.coins).toBe(4);
    const reloaded = JSON.parse(JSON.stringify(result.user));
    expect(play(reloaded, 'weekly', monday + DAY).reason).toBe('weekly');
    expect(play(reloaded, 'weekly', monday - DAY).reason).toBe('weekly');
    expect(play(reloaded, 'weekly', monday + 7 * DAY).coins).toBe(8);
  });
  it('uses the same daily limit as the other four games', () => {
    let user = activeUser();
    for (const game of ['market', 'snake', 'weekly'] as const)
      user = play(user, game).user;
    expect(play(user, 'spacewar').reason).toBe('limit');
  });
});
