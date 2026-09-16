import { useState } from 'react';

import {
  type CatalogueItem,
  directionForKind,
  listCatalogueByShop,
  type ShopId,
} from '@/entities/catalogue';
import {
  applyPurchase,
  canAfford,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type ShopSheet = 'confirm' | 'shortage' | 'planning' | null;

/** Shortfall details shown on the shortage sheet — 2.5.6. */
interface ShopShortage {
  shortfall: number;
  price: number;
  balance: number;
  item: CatalogueItem;
}

interface ShopController {
  /** Which street shopfront this screen is. */
  shopId: ShopId;
  /** Balance on hand. */
  balance: number;
  /** Catalogue rows for this shop only. */
  items: readonly CatalogueItem[];
  /** True only while the period is `active`. */
  canShop: boolean;
  /** Item waiting for confirm or shortage explanation. */
  selected: CatalogueItem | null;
  /** Which sheet is open. */
  sheet: ShopSheet;
  /** Last shortfall details, when the wallet refused. */
  shortage: ShopShortage | null;
  /** How far the pending purchase would push fact over plan. */
  overPlanBy: number;
  selectItem: (item: CatalogueItem) => void;
  dismissSheet: () => void;
  confirmPurchase: () => void;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Shop controller for one street shopfront.
 *
 * No wallet math here — `applyPurchase` owns debit, fact and influence.
 */
export const useShop = (shopId: ShopId): ShopController => {
  const user = useUser();
  const updateUser = useUpdateUser();
  const time = useTimeSource();

  const [selected, setSelected] = useState<CatalogueItem | null>(null);
  const [sheet, setSheet] = useState<ShopSheet>(null);
  const [shortage, setShortage] = useState<ShopShortage | null>(null);

  const canShop = user?.period.phase === 'active';
  const balance = user?.wallet.balance ?? 0;

  const overPlanBy =
    user && selected
      ? Math.max(
          0,
          user.period.fact[directionForKind(selected.kind)] +
            selected.price -
            user.period.plan[directionForKind(selected.kind)],
        )
      : 0;

  return {
    shopId,
    balance,
    items: listCatalogueByShop(shopId),
    canShop: Boolean(canShop),
    selected,
    sheet,
    shortage,
    overPlanBy,

    selectItem: (item) => {
      if (!user) return;
      if (user.period.phase === 'planning') {
        setSelected(item);
        setSheet('planning');
        return;
      }
      if (user.period.phase !== 'active') return;

      setSelected(item);
      if (!canAfford(user.wallet, item.price)) {
        setShortage({
          shortfall: item.price - user.wallet.balance,
          price: item.price,
          balance: user.wallet.balance,
          item,
        });
        setSheet('shortage');
        return;
      }
      setShortage(null);
      setSheet('confirm');
    },

    dismissSheet: () => {
      setSheet(null);
      setSelected(null);
      setShortage(null);
    },

    confirmPurchase: () => {
      if (!user || !selected) return;

      const result = applyPurchase(user, selected.id, time);
      if (!result.ok) {
        if (
          result.reason === 'insufficient_funds' &&
          result.shortfall != null &&
          result.price != null &&
          result.balance != null &&
          result.item
        ) {
          setShortage({
            shortfall: result.shortfall,
            price: result.price,
            balance: result.balance,
            item: result.item,
          });
          setSheet('shortage');
          return;
        }
        setSheet(null);
        setSelected(null);
        return;
      }

      updateUser(() => result.user);
      setSheet(null);
      setSelected(null);
      setShortage(null);
    },
  };
};

export type { ShopController, ShopSheet, ShopShortage };
