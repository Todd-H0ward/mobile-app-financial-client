import type { PetSkin } from '../../model';
import type { PetRig, RigEllipse } from '../rig';
import { VIEW_BOX } from '../rig';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Which color each part of the skeleton is painted with. */
interface PetFills {
  /** The body. */
  body: string;
  /** The belly patch over it. */
  belly: string;
  /** The head. The same coat as the body — a two-tone head reads as a mask. */
  head: string;
  /** Ears and tail: the shaded coat, so they read against the head. */
  limb: string;
  /** Pupils. */
  eye: string;
  /** Cheeks. */
  cheek: string;
  /** Spots and stripes. Unused when there are none. */
  mark: string;
  /** Outline of every silhouette part. */
  outline: string;
}

/**
 * Everything the coat adds on top of the skeleton: what is painted where, and
 * the marks laid over the body.
 *
 * Separate from `PetRig` on purpose. The skeleton answers *where the parts
 * are* and depends only on the species, so three of them cover all
 * twenty-seven looks; the skin answers *what it looks like* and is the axis
 * requirement 2.5.2 counts. Mixing them made the pattern part of the anatomy.
 */
interface PetSkinLayer {
  /** The palette, resolved part by part — the rig never picks a color. */
  fills: PetFills;
  /** Pattern marks in viewBox units, all inside the body. */
  marks: RigEllipse[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Ring the spots sit on, as a share of the body's radii. */
const SPOT_RING = 0.5;

/** Where the ring starts, in radians. Fixed, so a coat never reshuffles. */
const SPOT_PHASE = -Math.PI / 2;

/** Half-width of a stripe, as a share of the body's half-width. */
const STRIPE_WIDTH = 0.7;

/** How far the outermost stripes sit from the body's middle. */
const STRIPE_SPREAD = 10;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * The pattern, laid over one body.
 *
 * Deterministic on purpose: the same coat draws the same spots every render,
 * so a pet does not reshuffle its markings when the screen re-renders.
 */
const markEllipses = (
  body: RigEllipse,
  marks: PetSkin['marks'],
): RigEllipse[] => {
  if (marks.kind === 'none' || marks.count <= 0) return [];

  const radius = (marks.size * VIEW_BOX) / 2;

  if (marks.kind === 'spots') {
    return Array.from({ length: marks.count }, (_, index) => {
      const angle = SPOT_PHASE + (index * 2 * Math.PI) / marks.count;

      return {
        cx: body.cx + body.rx * SPOT_RING * Math.cos(angle),
        cy: body.cy + body.ry * SPOT_RING * Math.sin(angle),
        rx: radius,
        ry: radius,
      };
    });
  }

  // Stripes run across the body, spread evenly around its middle.
  const step = marks.count > 1 ? (STRIPE_SPREAD * 2) / (marks.count - 1) : 0;

  return Array.from({ length: marks.count }, (_, index) => ({
    cx: body.cx,
    cy: body.cy - STRIPE_SPREAD + index * step,
    rx: body.rx * STRIPE_WIDTH,
    ry: radius,
  }));
};

// ═══════════════════════════════════════════
// SKIN LAYER
// ═══════════════════════════════════════════

/**
 * The coat over a skeleton: fills for every part and the pattern over the body.
 *
 * Pure and theme-independent — a coat that changed with the color scheme would
 * make one pet read as two, and 2.5.2 is judged on two screenshots side by
 * side. The marks need the skeleton because they follow the body they sit on,
 * which is why the rig comes in rather than a size.
 */
export const skinLayerFor = (rig: PetRig, skin: PetSkin): PetSkinLayer => ({
  fills: {
    body: skin.coat,
    belly: skin.belly,
    head: skin.coat,
    limb: skin.shade,
    eye: skin.eye,
    cheek: skin.blush,
    mark: skin.ink,
    outline: skin.outline,
  },
  marks: markEllipses(rig.body, skin.marks),
});

export type { PetFills, PetSkinLayer };
