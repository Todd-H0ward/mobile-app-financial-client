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
