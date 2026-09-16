import { describe, expect, it } from 'vitest';

import { PET_COLORS, PET_PATTERNS, PET_SPECIES } from '../../model';
import { type PetRig, type RigEllipse, rigFor } from '../rig';
import { silhouetteFor, skinFor } from '../skin';

import { skinLayerFor } from './skin-layer';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Every combination of the three appearance axes, skeleton included. */
const everyLook = () =>
  PET_SPECIES.flatMap((species) => {
    const rig = rigFor(silhouetteFor(species));

    return PET_COLORS.flatMap((color) =>
      PET_PATTERNS.map((pattern) => {
        const skin = skinFor(species, color, pattern);

        return {
          color,
          layer: skinLayerFor(rig, skin),
          pattern,
          rig,
          skin,
          species,
        };
      }),
    );
  });

/** Whether the inner ellipse stays inside the outer one, outline and all. */
const isInside = (inner: RigEllipse, outer: RigEllipse, steps = 64) =>
  Array.from(
    { length: steps },
    (_, index) => (index * 2 * Math.PI) / steps,
  ).every((angle) => {
    const dx = (inner.cx + inner.rx * Math.cos(angle) - outer.cx) / outer.rx;
    const dy = (inner.cy + inner.ry * Math.sin(angle) - outer.cy) / outer.ry;

    return dx * dx + dy * dy <= 1;
  });

// ═══════════════════════════════════════════
// 1. One skeleton carries every coat
// ═══════════════════════════════════════════

describe('the skin is a layer over the skeleton', () => {
  it('paints nine different looks onto three skeletons', () => {
    const skeletons = new Set(
      PET_SPECIES.map((species) =>
        JSON.stringify(rigFor(silhouetteFor(species))),
      ),
    );
    const looks = new Set(
      everyLook()
        .filter(({ pattern }) => pattern === 'solid')
        .map(({ layer }) => JSON.stringify(layer.fills)),
    );

    expect(skeletons.size).toBe(3);
    // Three skeletons, three coats: the nine of 2.5.2 without a fourth axis.
    expect(skeletons.size * looks.size).toBeGreaterThanOrEqual(9);
  });

  it('does not depend on the skeleton for its colors', () => {
    const sand = skinFor('cat', 'sand', 'solid');
    const onCat = skinLayerFor(rigFor(silhouetteFor('cat')), sand);
    const onDog = skinLayerFor(rigFor(silhouetteFor('dog')), sand);

    expect(onCat.fills).toEqual(onDog.fills);
  });

  it('leaves no color to the rig: every part is named here', () => {
    for (const { layer, skin } of everyLook()) {
      expect(layer.fills).toEqual({
        belly: skin.belly,
        body: skin.coat,
        cheek: skin.blush,
        eye: skin.eye,
        head: skin.coat,
        limb: skin.shade,
        mark: skin.ink,
        outline: skin.outline,
      });
    }
  });
});

// ═══════════════════════════════════════════
// 2. The pattern
// ═══════════════════════════════════════════

describe('marks', () => {
  it('draws exactly as many as the skin asks for', () => {
    for (const { layer, skin } of everyLook()) {
      expect(layer.marks).toHaveLength(skin.marks.count);
    }
  });

  it('draws none at all for a solid coat', () => {
    for (const { layer, pattern } of everyLook()) {
      if (pattern === 'solid') expect(layer.marks).toHaveLength(0);
    }
  });

  it('keeps every mark on the coat, not hanging off the side', () => {
    for (const { layer, rig } of everyLook()) {
      for (const mark of layer.marks) {
        expect(isInside(mark, rig.body)).toBe(true);
      }
    }
  });

  it('follows the body it sits on: a wider pet gets wider stripes', () => {
    const striped = skinFor('cat', 'mint', 'stripes');
    const onCat = skinLayerFor(rigFor(silhouetteFor('cat')), striped);
    const onCapybara = skinLayerFor(rigFor(silhouetteFor('capybara')), striped);

    expect(onCapybara.marks[0]?.rx).toBeGreaterThan(onCat.marks[0]?.rx ?? 0);
  });

  it('places the same marks every time, so a coat never reshuffles', () => {
    const rig: PetRig = rigFor(silhouetteFor('dog'));
    const skin = skinFor('dog', 'mint', 'spots');

    expect(skinLayerFor(rig, skin).marks).toEqual(
      skinLayerFor(rig, skin).marks,
    );
  });
});
