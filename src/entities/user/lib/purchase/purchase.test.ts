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
    const result = applyPurchase(makeActive(), 'bread', time);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user.wallet.balance).toBe(50 - 8);
    expect(result.user.wallet.history[0]).toMatchObject({
      kind: 'spend',
      source: 'purchase:bread',
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

    const result = applyPurchase(poor, 'sweater', time);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('insufficient_funds');
    expect(result.shortfall).toBe(37);
    expect(poor.wallet.balance).toBe(3);
  });

  it('refuses outside the active phase', () => {
    const time = makeDemoTimeSource();
    const result = applyPurchase(makeUser(), 'bread', time);
    expect(result).toEqual({ ok: false, reason: 'wrong_phase' });
  });

  it('reports how far fact went over plan', () => {
    const time = makeDemoTimeSource();
    const active = makeActive();
    // Plan wants = 15; lamp = 18 → over by 3.
    const result = applyPurchase(active, 'lamp', time);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.overPlanBy).toBe(3);
  });

  it('can bump comfort when the item carries a delta', () => {
    const time = makeDemoTimeSource();
    const active = makeActive();
    const chilly: UserSave = {
      ...active,
      pet: { ...active.pet, comfort: 0.4 },
    };
    const result = applyPurchase(chilly, 'heating', time);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.pet.comfort).toBeGreaterThan(0.4);
  });

  it('charges chilly less for food — trait shifts the till', () => {
    const time = makeDemoTimeSource();
    const active = makeActive();
    const chilly: UserSave = {
      ...active,
      pet: { ...active.pet, traitIds: ['chilly'] },
    };
    const result = applyPurchase(chilly, 'bread', time);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Catalogue bread is 8; chilly food ×0.8 → 6.
    expect(result.price).toBe(6);
    expect(result.user.wallet.balance).toBe(50 - 6);
    expect(result.user.period.fact.needs).toBe(6);
  });
});
