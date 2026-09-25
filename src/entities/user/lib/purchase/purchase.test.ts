import { describe, expect, it } from 'vitest';

import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import type { UserSave } from '../../model/types';
import { startPeriod } from '../period';

import { applyPurchase } from './purchase';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const makeUser = (overrides: Partial<UserSave> = {}): UserSave => ({
  ...createInitialUser({ playerName: 'Аня', createdAt: 0 }),
  ...overrides,
  period: {
    ...createInitialUser().period,
    plan: { needs: 20, wants: 15, savings: 10 },
    ...overrides.period,
  },
});

const makeActive = (): UserSave => startPeriod(makeUser());

// ═══════════════════════════════════════════
describe('applyPurchase', () => {
  it('debits the wallet and bumps fact for the item direction', () => {
    const time = makeDemoTimeSource();
    const result = applyPurchase(makeActive(), 'charge-small', time);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user.wallet.balance).toBe(50 - 8);
    expect(result.user.wallet.history[0]).toMatchObject({
      kind: 'spend',
      source: 'purchase:charge-small',
      direction: 'needs',
      amount: 8,
    });
    expect(result.user.period.fact.needs).toBe(8);
  });

  it('refuses when the balance is short — never goes negative', () => {
    const time = makeDemoTimeSource();
    const active = makeActive();
    const poor: UserSave = {
      ...active,
      wallet: { ...active.wallet, balance: 3 },
    };

    const result = applyPurchase(poor, 'module-core', time);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('insufficient_funds');
    expect(result.shortfall).toBe(47);
    expect(poor.wallet.balance).toBe(3);
  });

  it('refuses outside the active phase', () => {
    const time = makeDemoTimeSource();
    const result = applyPurchase(makeUser(), 'charge-small', time);
    expect(result).toEqual({ ok: false, reason: 'wrong_phase' });
  });

  it('reports how far fact went over plan', () => {
    const time = makeDemoTimeSource();
    const active = makeActive();
    // Plan wants = 15; module-sensor = 20 → over by 5.
    const result = applyPurchase(active, 'module-sensor', time);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.overPlanBy).toBe(5);
  });

  it('can bump charge when the item carries a delta', () => {
    const time = makeDemoTimeSource();
    const active = makeActive();
    const drained: UserSave = {
      ...active,
      robot: { ...active.robot, charge: 0.4 },
    };
    const result = applyPurchase(drained, 'charge-small', time);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.robot.charge).toBeGreaterThan(0.4);
  });

  it('keeps an owned id — the arcade unlocks off it', () => {
    const time = makeDemoTimeSource();
    const result = applyPurchase(makeActive(), 'puzzle-arena', time);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.ownedItemIds).toContain('rooms-living');
  });

  it('records a bought module on ModulesSave', () => {
    const time = makeDemoTimeSource();
    const result = applyPurchase(makeActive(), 'module-sensor', time);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.modules.owned).toContain('module-sensor');
    expect(result.user.modules.tier).toBe(1);
  });

  it('charges the catalogue price as is', () => {
    const time = makeDemoTimeSource();
    const result = applyPurchase(makeActive(), 'charge-small', time);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.price).toBe(8);
    expect(result.user.wallet.balance).toBe(50 - 8);
    expect(result.user.period.fact.needs).toBe(8);
  });
});
