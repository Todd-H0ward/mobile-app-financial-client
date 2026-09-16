import { describe, expect, it } from 'vitest';

import {
  PET_COLORS,
  PET_INK,
  PET_PALETTE,
  PET_PATTERNS,
  PET_SPECIES,
  type PetSkin,
} from '../../model';

import { silhouetteFor, skinFor } from './skin';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** All 27 combinations of the three axes. */
const everySkin = () =>
  PET_SPECIES.flatMap((species) =>
    PET_COLORS.flatMap((color) =>
      PET_PATTERNS.map((pattern) => ({
        color,
        pattern,
        skin: skinFor(species, color, pattern),
        species,
      })),
    ),
  );

/** The color fields of a skin, in one list. */
const fillsOf = (skin: PetSkin) => [
  skin.coat,
  skin.shade,
  skin.belly,
  skin.ink,
  skin.outline,
  skin.eye,
  skin.blush,
];

// ═══════════════════════════════════════════
// 1. At least nine visually distinct pets — 2.5.2
// ═══════════════════════════════════════════

describe('the nine', () => {
  it('gives nine distinguishable pets from species and coat alone', () => {
    const looks = PET_SPECIES.flatMap((species) =>
      PET_COLORS.map((color) => {
        const { silhouette, coat } = skinFor(species, color, 'solid');

        return [
          silhouette.earShape,
          silhouette.tailShape,
          silhouette.bodyRatio,
          coat,
        ].join('|');
      }),
    );

    expect(new Set(looks).size).toBe(9);
  });

  it('separates the three species by silhouette, not by shade', () => {
    const [cat, dog, capybara] = PET_SPECIES.map(silhouetteFor);

    expect(new Set([cat.earShape, dog.earShape, capybara.earShape]).size).toBe(
      3,
    );
    expect(
      new Set([cat.tailShape, dog.tailShape, capybara.tailShape]).size,
    ).toBe(3);
    expect(capybara.bodyRatio).toBeGreaterThan(cat.bodyRatio);
  });

  it('covers every combination the axes allow', () => {
    const skins = everySkin();

    expect(skins).toHaveLength(27);
    for (const { skin, species, pattern } of skins) {
      expect(skin.species).toBe(species);
      expect(skin.pattern).toBe(pattern);
    }
  });
});

// ═══════════════════════════════════════════
// 2. Colors come from the palette, never from a literal
// ═══════════════════════════════════════════

describe('the palette is the only source of color', () => {
  it('takes every fill from PET_PALETTE or PET_INK', () => {
    const inks = Object.values(PET_INK);

    for (const { skin, color } of everySkin()) {
      const allowed = [...Object.values(PET_PALETTE[color]), ...inks];

      for (const fill of fillsOf(skin)) {
        expect(allowed).toContain(fill);
      }
    }
  });

  it('never repeats a fill inside one skin, or the drawing disappears', () => {
    for (const { skin } of everySkin()) {
      expect(new Set(fillsOf(skin)).size).toBe(fillsOf(skin).length);
    }
  });
});

// ═══════════════════════════════════════════
// 3. The pattern layer
// ═══════════════════════════════════════════

describe('marks', () => {
  it('draws nothing at all for a solid coat', () => {
    for (const species of PET_SPECIES) {
      expect(skinFor(species, 'sand', 'solid').marks).toEqual({
        count: 0,
        kind: 'none',
        size: 0,
      });
    }
  });

  it('asks for marks big enough to see on the other two', () => {
    for (const pattern of ['spots', 'stripes'] as const) {
      const { marks } = skinFor('cat', 'mint', pattern);

      expect(marks.kind).toBe(pattern);
      expect(marks.count).toBeGreaterThan(0);
      expect(marks.size).toBeGreaterThan(0);
      expect(marks.size).toBeLessThan(1);
    }
  });
});

// ═══════════════════════════════════════════
// 4. Pure, and nothing shared between calls
// ═══════════════════════════════════════════

describe('skinFor is pure', () => {
  it('gives equal skins for equal arguments, in separate objects', () => {
    const first = skinFor('dog', 'graphite', 'spots');
    const second = skinFor('dog', 'graphite', 'spots');

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.silhouette).not.toBe(second.silhouette);
    expect(first.marks).not.toBe(second.marks);
  });

  it('does not let a caller mutate the tables through what it got', () => {
    const skin = skinFor('cat', 'sand', 'spots');
    skin.silhouette.bodyRatio = 99;
    skin.marks.count = 99;

    expect(skinFor('cat', 'sand', 'spots').silhouette.bodyRatio).not.toBe(99);
    expect(skinFor('cat', 'sand', 'spots').marks.count).not.toBe(99);
  });
});
