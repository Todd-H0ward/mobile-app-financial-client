import type { CatalogueItem, ShopId } from '../../model';
import { assertCatalogueContent } from '../schema';

import CATALOGUE_CONTENT from '@/content/catalogue.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const ITEMS = assertCatalogueContent(CATALOGUE_CONTENT).items;

export const listCatalogue = (): readonly CatalogueItem[] => ITEMS;

export const listCatalogueByShop = (shopId: ShopId): readonly CatalogueItem[] =>
  ITEMS.filter((item) => item.shop === shopId);

export const getCatalogueItem = (id: string): CatalogueItem | undefined =>
  ITEMS.find((item) => item.id === id);

/**
 * What a child buys instead when the item is a one-time thing already owned: the unowned
 * item of the same kind closest in price.
 */
export const pickBuyable = (
  id: string,
  ownedIds: readonly string[],
): CatalogueItem | undefined => {
  const item = getCatalogueItem(id);
  if (!item) return undefined;
  const isOwned = (entry: CatalogueItem) =>
    entry.ownedId !== undefined && ownedIds.includes(entry.ownedId);
  if (!isOwned(item)) return item;

  return ITEMS.filter((entry) => entry.kind === item.kind && !isOwned(entry))
    .sort(
      (a, b) =>
        Math.abs(a.price - item.price) - Math.abs(b.price - item.price) ||
        a.price - b.price,
    )
    .at(0);
};
