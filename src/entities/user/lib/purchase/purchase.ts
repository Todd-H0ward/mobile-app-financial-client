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

  const direction = directionForKind(item.kind);
  const debit = debitWallet(user.wallet, {
    source: `purchase:${item.id}`,
    amount: item.price,
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

  const factNext = user.period.fact[direction] + item.price;
  const overPlanBy = Math.max(0, factNext - user.period.plan[direction]);

  let comfort = user.pet.comfort;
  if (item.comfortDelta != null) {
    comfort = clamp(comfort + item.comfortDelta, 0, 1);
  }

  const furnitureIds =
    item.furnitureId && !user.home.furnitureIds.includes(item.furnitureId)
      ? [...user.home.furnitureIds, item.furnitureId]
      : user.home.furnitureIds;

  const insulationIds =
    item.insulationId && !user.home.insulationIds.includes(item.insulationId)
      ? [...user.home.insulationIds, item.insulationId]
      : user.home.insulationIds;

  return {
    ok: true,
    overPlanBy,
    item,
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
      pet: {
        ...user.pet,
        comfort,
      },
      home: {
        ...user.home,
        furnitureIds,
        insulationIds,
      },
    },
  };
};

export type { PurchaseFail, PurchaseOk, PurchaseResult };
