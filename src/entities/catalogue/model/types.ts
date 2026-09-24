const SHOP_IDS = ['grocery', 'clothes', 'furniture', 'toys'] as const;

/** Id of one of the four street shops. */
type ShopId = (typeof SHOP_IDS)[number];

/** Kind of a shop item — maps onto a budget direction. */
type CatalogueKind = 'need' | 'want';

/** One purchasable row from `content/catalogue.json`. */
interface CatalogueItem {
  /** Stable id. Wallet history uses `purchase:<id>`. */
  id: string;
  title: string;
  /** Price in coins, positive integer. */
  price: number;
  /**
   * Need → `needs` fact, want → `wants` fact. Never `savings` — the jar is
   * not a shop aisle (docs/economy.md).
   */
  kind: CatalogueKind;
  shop: ShopId;
  /** Soft grouping inside a shop: food, hygiene, toy, … */
  category: string;
  /** Optional bump to the robot's charge, 0…1. */
  chargeDelta?: number;
  /**
   * Optional id the purchase leaves in `ownedItemIds` — what a bought toy or
   * the console unlocks in the arcade.
   */
  ownedId?: string;
  /** Extra line under the title — why it exists. */
  note?: string;
}

interface CatalogueFile {
  items: CatalogueItem[];
}

export type { CatalogueFile, CatalogueItem, CatalogueKind, ShopId };
export { SHOP_IDS };
