import { describe, expect, it } from 'vitest';

import { PERIOD_NEED_DECAY } from '@/entities/economy';

import {
  assertTraitsContent,
  getTraitById,
  listTraits,
  needDecayFor,
  priceFor,
} from './index';

import TRAITS_CONTENT from '@/content/traits.json';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const withTraits = (traits: unknown[]) => ({ traits });

const BASE_TRAIT = {
  id: 'spare',
  title: 'Запасная',
  blurb: 'Тестовая черта.',
  priceByCategory: { food: 0.9 },
};

// ═══════════════════════════════════════════
// 1. Shipped content
// ═══════════════════════════════════════════

describe('content/traits.json', () => {
  it('passes the schema', () => {
    expect(() => assertTraitsContent(TRAITS_CONTENT)).not.toThrow();
  });

  it('carries at least three traits', () => {
    expect(listTraits().length).toBeGreaterThanOrEqual(3);
  });

  it('has unique ids, and every one is findable', () => {
    const ids = listTraits().map((trait) => trait.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(getTraitById(id)?.id).toBe(id);
    }
  });

  it('includes chilly — cheaper food, faster comfort decay', () => {
    const chilly = getTraitById('chilly');
    expect(chilly?.priceByCategory?.food).toBeLessThan(1);
    expect(chilly?.decay?.comfort).toBeGreaterThan(1);
  });
});

// ═══════════════════════════════════════════
// 2. Broken content fails here
// ═══════════════════════════════════════════

describe('assertTraitsContent', () => {
  const valid = TRAITS_CONTENT.traits;

  it('rejects a trait without id, title or blurb', () => {
    expect(() =>
      assertTraitsContent(withTraits([...valid, { ...BASE_TRAIT, id: '' }])),
    ).toThrow(/id/);
    expect(() =>
      assertTraitsContent(withTraits([...valid, { ...BASE_TRAIT, title: 42 }])),
    ).toThrow(/title/);
    expect(() =>
      assertTraitsContent(withTraits([...valid, { ...BASE_TRAIT, blurb: '' }])),
    ).toThrow(/blurb/);
  });

  it('rejects a non-positive multiplier', () => {
    expect(() =>
      assertTraitsContent(
        withTraits([...valid, { ...BASE_TRAIT, priceByCategory: { food: 0 } }]),
      ),
    ).toThrow(/food/);
  });

  it('rejects a trait with no modifiers', () => {
    expect(() =>
      assertTraitsContent(
        withTraits([
          ...valid,
          { id: 'empty', title: 'Пустая', blurb: 'Без эффекта.' },
        ]),
      ),
    ).toThrow(/modifier/);
  });

  it('rejects a duplicate id', () => {
    expect(() => assertTraitsContent(withTraits([...valid, valid[0]]))).toThrow(
      /duplicate/,
    );
  });

  it('rejects a file with too few traits', () => {
    expect(() => assertTraitsContent(withTraits(valid.slice(0, 2)))).toThrow(
      /at least/,
    );
  });
});

// ═══════════════════════════════════════════
// 3. Modifiers — prices and speeds, not copy
// ═══════════════════════════════════════════

describe('priceFor', () => {
  it('cheapens food for chilly and leaves toys alone', () => {
    expect(priceFor(10, 'food', ['chilly'])).toBe(8);
    expect(priceFor(10, 'toy', ['chilly'])).toBe(10);
  });

  it('ignores unknown ids — migration / typo', () => {
    expect(priceFor(10, 'food', ['no-such-trait'])).toBe(10);
  });

  it('never drops below one coin', () => {
    expect(priceFor(1, 'food', ['chilly'])).toBe(1);
  });
});

describe('needDecayFor', () => {
  it('raises comfort decay for chilly', () => {
    const decay = needDecayFor(['chilly']);
    expect(decay.comfort).toBeGreaterThan(PERIOD_NEED_DECAY.comfort);
    expect(decay.spirit).toBe(PERIOD_NEED_DECAY.spirit);
  });

  it('returns the baseline when traitIds are empty', () => {
    expect(needDecayFor([])).toEqual({
      comfort: PERIOD_NEED_DECAY.comfort,
      spirit: PERIOD_NEED_DECAY.spirit,
    });
  });
});
