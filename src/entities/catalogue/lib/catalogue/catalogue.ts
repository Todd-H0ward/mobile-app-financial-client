import type { CatalogueItem, ShopId } from '../../model';
import { assertCatalogueContent } from '../schema';

import CATALOGUE_CONTENT from '@/content/catalogue.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const ITEMS = assertCatalogueContent(CATALOGUE_CONTENT).items;

/** Every shop item from `content/catalogue.json`, in file order. */
export const listCatalogue = (): readonly CatalogueItem[] => ITEMS;

/** Items sold in one street shopfront. */
export const listCatalogueByShop = (shopId: ShopId): readonly CatalogueItem[] =>
  ITEMS.filter((item) => item.shop === shopId);

/** Look up one item by id. `undefined` if the content has no such row. */
export const getCatalogueItem = (id: string): CatalogueItem | undefined =>
  ITEMS.find((item) => item.id === id);
