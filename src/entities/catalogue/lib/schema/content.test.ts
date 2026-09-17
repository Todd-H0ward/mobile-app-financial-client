import { describe, expect, it } from 'vitest';

import {
  assertCatalogueContent,
  directionForKind,
  getCatalogueItem,
  listCatalogue,
  listCatalogueByShop,
  listOwnedToys,
  SHOP_IDS,
} from '../..';

import CATALOGUE_CONTENT from '@/content/catalogue.json';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const EXTRA = {
  id: 'blocks',
  title: 'Кубики',
  price: 9,
  kind: 'want' as const,
  shop: 'toys' as const,
  category: 'toy',
};

const withItems = (items: unknown[]) => ({ items });

// ═══════════════════════════════════════════
// 1. The shipped content is valid — 2.5.6
// ═══════════════════════════════════════════

describe('content/catalogue.json', () => {
  it('passes the schema', () => {
    expect(() => assertCatalogueContent(CATALOGUE_CONTENT)).not.toThrow();
  });

  it('carries at least eight items', () => {
    expect(listCatalogue().length).toBeGreaterThanOrEqual(8);
  });

  it('has both needs and wants', () => {
    const kinds = new Set(listCatalogue().map((item) => item.kind));
    expect(kinds.has('need')).toBe(true);
    expect(kinds.has('want')).toBe(true);
  });

  it('stocks every street shop', () => {
    for (const shop of SHOP_IDS) {
      expect(listCatalogueByShop(shop).length).toBeGreaterThan(0);
    }
  });

  it('has unique ids, and every one is findable', () => {
    const ids = listCatalogue().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(getCatalogueItem(id)?.id).toBe(id);
    }
  });

  it('stocks at least one insulation upgrade — house.md payback needs it', () => {
    const insulation = listCatalogue().filter((item) => item.insulationId);
    expect(insulation.length).toBeGreaterThan(0);
    for (const item of insulation) {
      expect(item.insulationId).toBeTruthy();
    }
  });

  it('lists toys unlocked by furniture ids', () => {
    expect(listOwnedToys([])).toEqual([]);
    const owned = listOwnedToys([
      'toy-car',
      'rooms-living',
      'rug',
      'game-console',
    ]);
    expect(owned.map((item) => item.id).sort()).toEqual(
      ['game-console', 'puzzle-living', 'toy-car'].sort(),
    );
  });

  it('maps kinds onto budget directions', () => {
    expect(directionForKind('need')).toBe('needs');
    expect(directionForKind('want')).toBe('wants');
  });

  it('accepts a new item added as a plain JSON row — 2.5.14', () => {
    expect(() =>
      assertCatalogueContent(withItems([...CATALOGUE_CONTENT.items, EXTRA])),
    ).not.toThrow();
  });
});

// ═══════════════════════════════════════════
// 2. Broken content fails here, never on the device
// ═══════════════════════════════════════════

describe('assertCatalogueContent', () => {
  const valid = CATALOGUE_CONTENT.items;

  it('rejects a missing id or title', () => {
    expect(() =>
      assertCatalogueContent(withItems([...valid, { ...EXTRA, id: '' }])),
    ).toThrow(/id/);
    expect(() =>
      assertCatalogueContent(withItems([...valid, { ...EXTRA, title: 1 }])),
    ).toThrow(/title/);
  });

  it('rejects a non-positive price', () => {
    for (const price of [0, -3, 2.5]) {
      expect(() =>
        assertCatalogueContent(withItems([...valid, { ...EXTRA, price }])),
      ).toThrow(/price/);
    }
  });

  it('rejects a duplicate id', () => {
    expect(() =>
      assertCatalogueContent(withItems([...valid, valid[0]])),
    ).toThrow(/duplicate/);
  });

  it('rejects a file with too few items', () => {
    expect(() => assertCatalogueContent(withItems(valid.slice(0, 4)))).toThrow(
      /at least/,
    );
  });

  it('rejects a catalogue with only one kind', () => {
    const onlyNeeds = valid.filter((item) => item.kind === 'need');
    while (onlyNeeds.length < 8) {
      onlyNeeds.push({
        ...onlyNeeds[0],
        id: `need-extra-${onlyNeeds.length}`,
      });
    }
    expect(() => assertCatalogueContent(withItems(onlyNeeds))).toThrow(/want/);
  });

  it('rejects an unknown shop id', () => {
    expect(() =>
      assertCatalogueContent(
        withItems([...valid, { ...EXTRA, id: 'x', shop: 'pharmacy' }]),
      ),
    ).toThrow(/shop/);
  });
});
