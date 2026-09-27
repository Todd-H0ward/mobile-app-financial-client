import {
  type CatalogueItem,
  directionForKind,
  getCatalogueItem,
  isModuleItem,
} from '@/entities/catalogue';

import type { TimeSource } from '@/shared/lib/time-source';
import { clamp } from '@/shared/utils';

import type { ModulesSave, UserSave } from '../../model';
import { debitWallet } from '../wallet';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const withPurchasedModule = (
  modules: ModulesSave,
  item: CatalogueItem,
): ModulesSave => {
  if (!isModuleItem(item) || !item.ownedId) return modules;
  if (modules.owned.includes(item.ownedId)) return modules;

  const owned = [...modules.owned, item.ownedId];
  const tier = Math.min(3, owned.length) as ModulesSave['tier'];
  return { ...modules, owned, tier };
};

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
  reason:
    | 'insufficient_funds'
    | 'wrong_phase'
    | 'unknown_item'
    | 'already_owned';
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

/** Buys one catalogue item: debit the wallet, bump period fact, apply influence. */
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

  if (item.ownedId && user.ownedItemIds.includes(item.ownedId)) {
    return { ok: false, reason: 'already_owned', item };
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
      modules: withPurchasedModule(user.modules, item),
    },
  };
};

export type { PurchaseFail, PurchaseOk, PurchaseResult };
