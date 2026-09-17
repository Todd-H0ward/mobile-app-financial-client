import { useMemo, useState } from 'react';

import { useShowFeedback } from '@/features/feedback';

import {
  type CatalogueItem,
  directionForKind,
  listCatalogueByShop,
  type ShopId,
} from '@/entities/catalogue';
import {
  applyPurchase,
  canAfford,
  explainShortage,
  type ShortageExplain,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { hapticSuccess, useTimeSource } from '@/shared/lib';

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
    shopId: ShopId;
    balance: number;
    items: readonly CatalogueItem[];
  /** True only while the period is `active`. */
  canShop: boolean;
  /** Item waiting for confirm or shortage explanation. */
  selected: CatalogueItem | null;
    sheet: ShopSheet;
  /** Last shortfall details, when the wallet refused. */
  shortage: ShopShortage | null;
  /**
   * Named recovery options with consequences — null until a shortage opens.
   * Built by `explainShortage` (docs/economy.md).
   */
  shortageExplain: ShortageExplain | null;
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
 * Shortage copy comes from `explainShortage`, not from hard-coded strings.
 */
export const useShop = (shopId: ShopId): ShopController => {
  const user = useUser();
  const updateUser = useUpdateUser();
  const time = useTimeSource();
  const showFeedback = useShowFeedback();

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

  const shortageExplain = useMemo(() => {
    if (!user || !shortage) return null;
    return explainShortage({
      shortfall: shortage.shortfall,
      price: shortage.price,
      balance: shortage.balance,
      savings: user.savings,
    });
  }, [user, shortage]);

  return {
    shopId,
    balance,
    items: listCatalogueByShop(shopId),
    canShop: Boolean(canShop),
    selected,
    sheet,
    shortage,
    shortageExplain,
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

      // Close the confirm Modal before feedback — two stacked RN Modals
      // freeze touch handling after purchase.
      setSheet(null);
      setSelected(null);
      setShortage(null);
      updateUser(() => result.user);
      hapticSuccess();

      const feedback = {
        before: user,
        after: result.user,
        action: 'purchase' as const,
        overPlanBy: result.overPlanBy,
        params: { item: result.item.title },
      };
      // After React commits the confirm unmount — rAF can still race
      // concurrent render and remount two Modals in one frame.
      setTimeout(() => {
        showFeedback(feedback);
      }, 0);
    },
  };
};

export type { ShopController, ShopSheet, ShopShortage };
