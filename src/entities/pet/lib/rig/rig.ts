import type { PetAnchor, PetSkin } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** An ellipse in viewBox units, 0…100. */
interface RigEllipse {
  /** Centre across, 0…100. */
  cx: number;
  /** Centre down, 0…100. */
  cy: number;
  /** Half-width, above 0. */
  rx: number;
  /** Half-height, above 0. */
  ry: number;
}

/** A layer's pivot, in box fractions 0…1 — the same system as the anchors. */
type RigPivot = PetAnchor;

/** Both ears, as path data. Left and right are mirrored, never identical. */
interface RigEars {
  /** Path `d` of the left ear. */
  left: string;
  /** Path `d` of the right ear. */
  right: string;
}

/** Both eyes. The lid scales `ry` down; `rx` never moves. */
interface RigEyes {
  /** Left eye, fully open. */
  left: RigEllipse;
  /** Right eye, fully open. */
  right: RigEllipse;
}

/** Where each animated layer turns around, so a rotation looks hinged. */
interface RigPivots {
  /** Bottom of the body: the pet leans from its feet, not from its middle. */
  body: RigPivot;
  /** Base of the neck. */
  head: RigPivot;
  /** Base of the ears, so a drooping ear folds instead of sliding. */
  ear: RigPivot;
  /** Where the tail meets the body. */
  tail: RigPivot;
  /** Eye line: closing eyes shrink towards it from both sides. */
  eye: RigPivot;
}

/**
 * One pet, as geometry a renderer can hand straight to SVG.
 *
 * Everything is in viewBox units of a 100 × 100 box, which is also what the
 * anchors are fractions of: one `size` then scales the drawing, the attachment
 * points and the pivots together.
 */
interface PetRig {
  /** The body. Its width comes from `silhouette.bodyRatio`. */
  body: RigEllipse;
  /** The belly — a lighter patch over the body, always inside it. */
  belly: RigEllipse;
  /** The head. Its height is `silhouette.headRatio` of the box. */
  head: RigEllipse;
  /** Both ears. Their shape is a path, not an ellipse. */
  ears: RigEars;
  /** The tail as a path, or `null` for a capybara (`tailShape` is `none`). */
  tail: string | null;
  /** Both eyes, fully open. */
  eyes: RigEyes;
  /** Both cheeks — the one warm accent on the face, below the eyes. */
  cheeks: RigEyes;
  /** Pattern marks, exactly `skin.marks.count` of them, all inside the body. */
  marks: RigEllipse[];
  /** Where each animated layer turns around. */
  pivots: RigPivots;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Side of the drawing box. Every number below is in these units. */
const VIEW_BOX = 100;

/** Where the feet stand. The gap below is the shadow's room. */
const GROUND = 96;

/** Half-height of the body. The same for every species — width is the axis. */
const BODY_RY = 23;

/** How far the head sinks into the body, as a share of its own half-height. */
const HEAD_OVERLAP = 0.18;

/** Head half-width ÷ half-height. Slightly wide reads as young. */
const HEAD_WIDTH = 1.05;

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

/** A fraction of the box, for the pivot table. */
const fraction = (x: number, y: number): RigPivot => ({
  x: x / VIEW_BOX,
  y: y / VIEW_BOX,
});

/**
 * One ear, drawn from the head outwards.
 *
 * `side` is -1 for the left ear and 1 for the right one, so the two are
 * mirrored rather than written out twice.
 */
const earPath = (
  head: RigEllipse,
  shape: PetSkin['silhouette']['earShape'],
  side: number,
) => {
  const baseX = head.cx + side * head.rx * 0.55;
  const baseY = head.cy - head.ry * 0.62;
  const width = head.rx * 0.34;
  const height = head.ry * 0.55;

  if (shape === 'pointed') {
    // A triangle leaning outwards: the cat is read from this alone.
    return [
      `M ${baseX - width} ${baseY + height * 0.4}`,
      `L ${baseX + side * width * 0.6} ${baseY - height}`,
      `L ${baseX + width} ${baseY + height * 0.4}`,
      'Z',
    ].join(' ');
  }

  if (shape === 'floppy') {
    // A teardrop hanging down the side of the head.
    return [
      `M ${baseX - width * 0.7} ${baseY}`,
      `Q ${baseX + side * width * 1.6} ${baseY + height * 0.3}`,
      ` ${baseX + side * width * 0.9} ${baseY + height * 1.7}`,
      `Q ${baseX - side * width * 0.2} ${baseY + height * 1.2}`,
      ` ${baseX - width * 0.7} ${baseY}`,
      'Z',
    ].join(' ');
  }

  // 'round' — a low dome, barely clearing the skull.
  return [
    `M ${baseX - width} ${baseY + height * 0.5}`,
    `A ${width} ${height * 0.9} 0 0 1 ${baseX + width} ${baseY + height * 0.5}`,
    'Z',
  ].join(' ');
};

/** The tail, or `null` when the species has none. */
const tailPath = (
  body: RigEllipse,
  shape: PetSkin['silhouette']['tailShape'],
) => {
  if (shape === 'none') return null;

  const rootX = body.cx + body.rx * 0.8;
  const rootY = body.cy + body.ry * 0.3;
  const reach = shape === 'long' ? 1 : 0.42;
  const thickness = body.ry * 0.16;

  return [
    `M ${rootX} ${rootY + thickness}`,
    `Q ${rootX + 14 * reach} ${rootY - 2 * reach}`,
    ` ${rootX + 9 * reach} ${rootY - 20 * reach}`,
    `L ${rootX + 9 * reach - thickness} ${rootY - 19 * reach}`,
    `Q ${rootX + 10 * reach - thickness} ${rootY - 3 * reach}`,
    ` ${rootX - thickness * 0.4} ${rootY + thickness}`,
    'Z',
  ].join(' ');
};

/**
 * The pattern layer.
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
// RIG
// ═══════════════════════════════════════════

/**
 * The whole pet as geometry, in a 100 × 100 viewBox.
 *
 * Pure and total: every skin produces a rig, and nothing here reads the theme
 * or the pose — the pose only moves the layers this function lays out.
 */
export const rigFor = (skin: PetSkin): PetRig => {
  const { bodyRatio, headRatio, earShape, tailShape } = skin.silhouette;

  const body: RigEllipse = {
    cx: VIEW_BOX / 2,
    cy: GROUND - BODY_RY,
    rx: BODY_RY * bodyRatio,
    ry: BODY_RY,
  };

  const headRy = (headRatio * VIEW_BOX) / 2;
  const head: RigEllipse = {
    cx: VIEW_BOX / 2,
    // Above the body's shoulders, sunk into them by `HEAD_OVERLAP` so the two
    // read as one animal rather than a ball balanced on an egg.
    cy: body.cy - body.ry - headRy * (1 - HEAD_OVERLAP),
    rx: headRy * HEAD_WIDTH,
    ry: headRy,
  };

  const eyeCy = head.cy + head.ry * 0.12;
  const eye = (side: number): RigEllipse => ({
    cx: head.cx + side * head.rx * 0.34,
    cy: eyeCy,
    rx: head.rx * 0.12,
    ry: head.ry * 0.17,
  });

  const cheek = (side: number): RigEllipse => ({
    cx: head.cx + side * head.rx * 0.52,
    cy: eyeCy + head.ry * 0.3,
    rx: head.rx * 0.15,
    ry: head.ry * 0.1,
  });

  return {
    body,
    belly: {
      cx: body.cx,
      cy: body.cy + body.ry * 0.25,
      rx: body.rx * 0.6,
      ry: body.ry * 0.6,
    },
    head,
    ears: {
      left: earPath(head, earShape, -1),
      right: earPath(head, earShape, 1),
    },
    tail: tailPath(body, tailShape),
    eyes: { left: eye(-1), right: eye(1) },
    cheeks: { left: cheek(-1), right: cheek(1) },
    marks: markEllipses(body, skin.marks),
    pivots: {
      body: fraction(body.cx, GROUND),
      head: fraction(head.cx, head.cy + head.ry * 0.8),
      ear: fraction(head.cx, head.cy - head.ry * 0.5),
      tail: fraction(body.cx + body.rx * 0.8, body.cy + body.ry * 0.3),
      eye: fraction(head.cx, eyeCy),
    },
  };
};

/**
 * An attachment point in design points, for a pet drawn at `size`.
 *
 * The anchors are fractions precisely so this multiplication is the only step
 * between the table and the screen — and it happens in one place, not on every
 * screen that hangs something on the pet.
 */
export const anchorPoint = (
  anchor: PetAnchor,
  size: number,
): { left: number; top: number } => ({
  left: anchor.x * size,
  top: anchor.y * size,
});

export type { PetRig, RigEars, RigEllipse, RigEyes, RigPivot, RigPivots };
export { VIEW_BOX };
