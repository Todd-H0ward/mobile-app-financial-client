import type { BudgetDirection } from '@/entities/economy';

import { isNonEmptyString, isRecord } from '@/shared/utils';

import type {
  CatalogueFile,
  CatalogueItem,
  CatalogueKind,
  ShopId,
} from '../../model';
import { SHOP_IDS } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** 2.5.6: the shop is only a choice when there is a real catalogue. */
const MIN_ITEMS = 8;

const KINDS: readonly CatalogueKind[] = ['need', 'want'];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isKnownShopId = (value: unknown): value is ShopId =>
  typeof value === 'string' && (SHOP_IDS as readonly string[]).includes(value);

const assertItem = (item: unknown, path: string): CatalogueItem => {
  if (!isRecord(item)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(item.id)) {
    throw new Error(`${path}.id: non-empty string required`);
  }
  if (!isNonEmptyString(item.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (
    typeof item.price !== 'number' ||
    !Number.isInteger(item.price) ||
    item.price <= 0
  ) {
    throw new Error(`${path}.price: positive integer required`);
  }
  if (item.kind !== 'need' && item.kind !== 'want') {
    throw new Error(`${path}.kind: "need" or "want" required`);
  }
  if (!isKnownShopId(item.shop)) {
    throw new Error(`${path}.shop: one of ${SHOP_IDS.join(', ')} required`);
  }
  if (!isNonEmptyString(item.category)) {
    throw new Error(`${path}.category: non-empty string required`);
  }
  if (
    item.chargeDelta !== undefined &&
    (typeof item.chargeDelta !== 'number' ||
      item.chargeDelta < 0 ||
      item.chargeDelta > 1)
  ) {
    throw new Error(`${path}.chargeDelta: number in 0…1 when present`);
  }
  if (item.ownedId !== undefined && !isNonEmptyString(item.ownedId)) {
    throw new Error(`${path}.ownedId: non-empty string when present`);
  }
  if (
    item.moduleTier !== undefined &&
    item.moduleTier !== 1 &&
    item.moduleTier !== 2 &&
    item.moduleTier !== 3
  ) {
    throw new Error(`${path}.moduleTier: must be 1, 2, or 3 when present`);
  }
  if (item.note !== undefined && !isNonEmptyString(item.note)) {
    throw new Error(`${path}.note: non-empty string when present`);
  }

  return item as unknown as CatalogueItem;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/catalogue.json` (or a fixture shaped like it).
 *
 * ≥8 items of both kinds, every street shop stocked — 2.5.6. Broken content
 * must fail in tests, not mid-purchase on the device — 2.5.14 / 3.2.
 */
export const assertCatalogueContent = (data: unknown): CatalogueFile => {
  if (!isRecord(data)) {
    throw new Error('catalogue content: must be an object');
  }
  if (!Array.isArray(data.items)) {
    throw new Error('catalogue content: "items" must be an array');
  }
  if (data.items.length < MIN_ITEMS) {
    throw new Error(
      `catalogue content: need at least ${MIN_ITEMS} items — 2.5.6`,
    );
  }

  const ids = new Set<string>();
  const kinds = new Set<CatalogueKind>();
  const shops = new Set<ShopId>();

  const items = data.items.map((item, index) => {
    const parsed = assertItem(item, `items[${index}]`);
    if (ids.has(parsed.id)) {
      throw new Error(`catalogue: duplicate id "${parsed.id}"`);
    }
    ids.add(parsed.id);
    kinds.add(parsed.kind);
    shops.add(parsed.shop);
    return parsed;
  });

  for (const kind of KINDS) {
    if (!kinds.has(kind)) {
      throw new Error(`catalogue content: missing kind "${kind}" — 2.5.6`);
    }
  }

  for (const shop of SHOP_IDS) {
    if (!shops.has(shop)) {
      throw new Error(`catalogue content: missing shop "${shop}"`);
    }
  }

  return { items };
};

/** Maps a catalogue kind onto the budget direction the fact updates. */
export const directionForKind = (kind: CatalogueKind): BudgetDirection =>
  kind === 'need' ? 'needs' : 'wants';

/** Whether a string is a known street shop id. */
export const isShopId = (value: string): value is ShopId =>
  (SHOP_IDS as readonly string[]).includes(value);
