import {
  type CatalogueItem,
  directionForKind,
  getCatalogueItem,
} from '@/entities/catalogue';

import type { TimeSource } from '@/shared/lib/time-source';
import { clamp } from '@/shared/utils';

import type { UserSave } from '../../model';
import { debitWallet } from '../wallet';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PurchaseOk {
  ok: true;
  user: UserSave;
  item: CatalogueItem;
  /** Coins actually charged after trait multipliers. */
  price: number;
  /** How far this purchase pushed fact over plan for its direction (≥ 0). */
  overPlanBy: number;
}

interface PurchaseFail {
  ok: false;
  reason: 'insufficient_funds' | 'wrong_phase' | 'unknown_item';
  /** Present when the wallet refused. */
  shortfall?: number;
  price?: number;
  balance?: number;
  item?: CatalogueItem;
}

type PurchaseResult = PurchaseOk | PurchaseFail;

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Buys one catalogue item: debit the wallet, bump period fact, apply influence.
 *
 * Only legal in the `active` phase — docs/game-period.md. Shortfalls come back
 * as a result so the shop can name the gap and the three recovery options
 * (2.5.6 / docs/economy.md).
 */
export const applyPurchase = (
  user: UserSave,
  itemId: string,
  time: TimeSource,
): PurchaseResult => {
  if (user.period.phase !== 'active') {
    return { ok: false, reason: 'wrong_phase' };
  }

  const item = getCatalogueItem(itemId);
  if (!item) {
    return { ok: false, reason: 'unknown_item' };
  }

  const price = item.price;
  const direction = directionForKind(item.kind);
  const debit = debitWallet(user.wallet, {
    source: `purchase:${item.id}`,
    amount: price,
    direction,
    periodIndex: user.period.index,
    at: time.now(),
  });

  if (!debit.ok) {
    return {
      ok: false,
      reason: 'insufficient_funds',
      shortfall: debit.shortfall,
      price: debit.price,
      balance: debit.balance,
      item,
    };
  }

  const factNext = user.period.fact[direction] + price;
  const overPlanBy = Math.max(0, factNext - user.period.plan[direction]);

  const charge =
    item.chargeDelta != null
      ? clamp(user.robot.charge + item.chargeDelta, 0, 1)
      : user.robot.charge;

  const ownedItemIds =
    item.ownedId && !user.ownedItemIds.includes(item.ownedId)
      ? [...user.ownedItemIds, item.ownedId]
      : user.ownedItemIds;

  return {
    ok: true,
    overPlanBy,
    item,
    price,
    user: {
      ...user,
      wallet: debit.wallet,
      period: {
        ...user.period,
        fact: {
          ...user.period.fact,
          [direction]: factNext,
        },
      },
      robot: {
        ...user.robot,
        charge,
      },
      ownedItemIds,
    },
  };
};

export type { PurchaseFail, PurchaseOk, PurchaseResult };
