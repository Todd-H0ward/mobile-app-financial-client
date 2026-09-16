import type { BudgetDirection } from '@/entities/economy';
import {
  STARTING_BALANCE,
  WALLET_HISTORY_LIMIT,
  WALLET_SOURCES,
} from '@/entities/economy';

import type { WalletEntry, WalletSave } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Everything a credit needs to name — 2.5.4: no nameless income. */
interface CreditInput {
  /** Where the coins came from. One of `WALLET_SOURCES`, or `task:<id>` /
   *  `purchase:<id>` once those exist. */
  source: string;
  /** Coins credited, above zero. */
  amount: number;
  /** Budget direction the fact went to. `null` for income — it funds none. */
  direction: BudgetDirection | null;
  /** Period the credit happened in, for the grown-up's report — 2.5.11. */
  periodIndex: number;
  /** Epoch ms, from `TimeSource.now()`. Stamped, never computed from. */
  at: number;
}

/** Everything a debit needs — same shape as a credit, but money leaves. */
type DebitInput = CreditInput;

/** Debit that went through — balance never went below zero. */
interface DebitOk {
  ok: true;
  wallet: WalletSave;
}

/**
 * Debit refused — 2.5.6. Returned, never thrown: the shop must explain the
 * shortfall rather than crash.
 */
interface DebitFail {
  ok: false;
  reason: 'insufficient_funds';
  /** How many more coins are needed. */
  shortfall: number;
  /** What the child tried to spend. */
  price: number;
  /** What they actually have. */
  balance: number;
}

type DebitResult = DebitOk | DebitFail;

// ═══════════════════════════════════════════
// WALLET
// ═══════════════════════════════════════════

/**
 * Credits coins to the wallet, with the entry that names them.
 *
 * The only door into `balance`: docs/economy.md — "ни один экран не пишет
 * баланс напрямую" — every coin the child ever has arrives through here, so
 * "no nameless income" is a property of one function rather than a rule every
 * call site has to remember.
 *
 * `WalletEntry.id` is built from `entryCount`, not from `history.length`:
 * the array is capped at `WALLET_HISTORY_LIMIT` and its length stops growing
 * once trimming starts, while `entryCount` never resets and never shrinks.
 *
 * @throws {Error} If `amount` is not a finite number above zero.
 */
export const creditWallet = (
  wallet: WalletSave,
  input: CreditInput,
): WalletSave => {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error(
      `creditWallet: amount must be a positive number, got ${input.amount}`,
    );
  }

  const entry: WalletEntry = {
    id: `${input.source}:${wallet.entryCount}`,
    source: input.source,
    amount: input.amount,
    kind: 'earn',
    direction: input.direction,
    periodIndex: input.periodIndex,
    at: input.at,
  };

  return {
    balance: wallet.balance + input.amount,
    history: [entry, ...wallet.history].slice(0, WALLET_HISTORY_LIMIT),
    entryCount: wallet.entryCount + 1,
  };
};

/**
 * Debits coins from the wallet — the only door out of `balance`.
 *
 * Never goes below zero: a shortfall is a returned result, not a throw and
 * not a silent clamp — docs/economy.md / 2.5.6.
 *
 * @throws {Error} If `amount` is not a finite number above zero.
 */
export const debitWallet = (
  wallet: WalletSave,
  input: DebitInput,
): DebitResult => {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error(
      `debitWallet: amount must be a positive number, got ${input.amount}`,
    );
  }

  if (wallet.balance < input.amount) {
    return {
      ok: false,
      reason: 'insufficient_funds',
      shortfall: input.amount - wallet.balance,
      price: input.amount,
      balance: wallet.balance,
    };
  }

  const entry: WalletEntry = {
    id: `${input.source}:${wallet.entryCount}`,
    source: input.source,
    amount: input.amount,
    kind: 'spend',
    direction: input.direction,
    periodIndex: input.periodIndex,
    at: input.at,
  };

  return {
    ok: true,
    wallet: {
      balance: wallet.balance - input.amount,
      history: [entry, ...wallet.history].slice(0, WALLET_HISTORY_LIMIT),
      entryCount: wallet.entryCount + 1,
    },
  };
};

/** Whether the wallet can pay `price` without going negative. */
export const canAfford = (wallet: WalletSave, price: number): boolean =>
  Number.isFinite(price) && price > 0 && wallet.balance >= price;

/**
 * The wallet a fresh profile starts with: the starting balance, credited as a
 * named entry rather than materialized as a bare number — 2.5.4 makes no
 * exception for the very first coin.
 */
export const startingWallet = (createdAt: number): WalletSave =>
  creditWallet(
    { balance: 0, history: [], entryCount: 0 },
    {
      source: WALLET_SOURCES.startingWallet,
      amount: STARTING_BALANCE,
      direction: null,
      periodIndex: 1,
      at: createdAt,
    },
  );

export type { CreditInput, DebitFail, DebitInput, DebitOk, DebitResult };
