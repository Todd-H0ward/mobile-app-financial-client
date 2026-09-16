import { describe, expect, it } from 'vitest';

import type { WalletSave } from '../../model';

import { canAfford, creditWallet, debitWallet } from './wallet';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const emptyWallet = (): WalletSave => ({
  balance: 0,
  history: [],
  entryCount: 0,
});

const funded = (balance: number): WalletSave =>
  creditWallet(emptyWallet(), {
    source: 'wallet:starting',
    amount: balance,
    direction: null,
    periodIndex: 1,
    at: 0,
  });

// ═══════════════════════════════════════════
describe('creditWallet', () => {
  it('raises the balance by exactly the amount credited', () => {
    const wallet = creditWallet(emptyWallet(), {
      source: 'bonus:regularity',
      amount: 5,
      direction: null,
      periodIndex: 1,
      at: 1000,
    });

    expect(wallet.balance).toBe(5);
  });

  it('records the source and the amount together, never one without the other', () => {
    const wallet = creditWallet(emptyWallet(), {
      source: 'task:change-counting',
      amount: 18,
      direction: null,
      periodIndex: 2,
      at: 2000,
    });

    expect(wallet.history[0]).toMatchObject({
      source: 'task:change-counting',
      amount: 18,
      kind: 'earn',
      direction: null,
      periodIndex: 2,
      at: 2000,
    });
  });

  it('puts the newest entry first', () => {
    const first = creditWallet(emptyWallet(), {
      source: 'wallet:starting',
      amount: 50,
      direction: null,
      periodIndex: 1,
      at: 0,
    });
    const second = creditWallet(first, {
      source: 'bonus:regularity',
      amount: 5,
      direction: null,
      periodIndex: 1,
      at: 100,
    });

    expect(second.history[0]?.source).toBe('bonus:regularity');
    expect(second.history[1]?.source).toBe('wallet:starting');
  });

  it('rejects a zero or negative amount instead of crediting silently', () => {
    expect(() =>
      creditWallet(emptyWallet(), {
        source: 'bonus:regularity',
        amount: 0,
        direction: null,
        periodIndex: 1,
        at: 0,
      }),
    ).toThrow();

    expect(() =>
      creditWallet(emptyWallet(), {
        source: 'bonus:regularity',
        amount: -5,
        direction: null,
        periodIndex: 1,
        at: 0,
      }),
    ).toThrow();
  });

  it('does not mutate the wallet it was given', () => {
    const wallet = emptyWallet();
    const snapshot = structuredClone(wallet);

    creditWallet(wallet, {
      source: 'bonus:regularity',
      amount: 5,
      direction: null,
      periodIndex: 1,
      at: 0,
    });

    expect(wallet).toEqual(snapshot);
  });
});

// ═══════════════════════════════════════════
describe('entry ids', () => {
  it('gives two credits from the same source two different ids', () => {
    const wallet = creditWallet(
      creditWallet(emptyWallet(), {
        source: 'bonus:regularity',
        amount: 5,
        direction: null,
        periodIndex: 1,
        at: 0,
      }),
      {
        source: 'bonus:regularity',
        amount: 5,
        direction: null,
        periodIndex: 2,
        at: 1,
      },
    );

    const ids = wallet.history.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('keeps entryCount growing past the point history starts trimming', () => {
    let wallet = emptyWallet();

    for (let period = 1; period <= 150; period += 1) {
      wallet = creditWallet(wallet, {
        source: 'bonus:regularity',
        amount: 1,
        direction: null,
        periodIndex: period,
        at: period,
      });
    }

    expect(wallet.history.length).toBeLessThan(150);
    expect(wallet.entryCount).toBe(150);

    const ids = wallet.history.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(wallet.history.length);
  });
});

// ═══════════════════════════════════════════
// 3. Spend never goes negative — 2.5.6
// ═══════════════════════════════════════════

describe('debitWallet', () => {
  it('lowers the balance and records a spend', () => {
    const result = debitWallet(funded(50), {
      source: 'purchase:bread',
      amount: 8,
      direction: 'needs',
      periodIndex: 1,
      at: 10,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wallet.balance).toBe(42);
    expect(result.wallet.history[0]).toMatchObject({
      source: 'purchase:bread',
      amount: 8,
      kind: 'spend',
      direction: 'needs',
    });
  });

  it('refuses a shortfall instead of going negative', () => {
    const result = debitWallet(funded(10), {
      source: 'purchase:sweater',
      amount: 40,
      direction: 'wants',
      periodIndex: 1,
      at: 10,
    });

    expect(result).toEqual({
      ok: false,
      reason: 'insufficient_funds',
      shortfall: 30,
      price: 40,
      balance: 10,
    });
  });

  it('leaves the wallet untouched when refused', () => {
    const wallet = funded(10);
    const snapshot = structuredClone(wallet);
    debitWallet(wallet, {
      source: 'purchase:sweater',
      amount: 40,
      direction: 'wants',
      periodIndex: 1,
      at: 10,
    });
    expect(wallet).toEqual(snapshot);
  });
});

describe('canAfford', () => {
  it('is true when the balance covers the price', () => {
    expect(canAfford(funded(12), 12)).toBe(true);
    expect(canAfford(funded(11), 12)).toBe(false);
  });
});
