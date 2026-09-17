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

/**
 * Toys already bought for the room — keyed by `furnitureId` in
 * `home.furnitureIds`. Used by the living-room shelf menu.
 */
export const listOwnedToys = (
  furnitureIds: readonly string[],
): readonly CatalogueItem[] =>
  ITEMS.filter(
    (item) =>
      item.shop === 'toys' &&
      item.furnitureId != null &&
      furnitureIds.includes(item.furnitureId),
  );

/**
 * One-off insulation upgrades — each carries an `insulationId` that lowers
 * every later heating bill (docs/house.md).
 */
export const listInsulationItems = (): readonly CatalogueItem[] =>
  ITEMS.filter((item) => item.insulationId != null);

export const getCatalogueItem = (id: string): CatalogueItem | undefined =>
  ITEMS.find((item) => item.id === id);
