// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Colour slots a shape can be painted with. The palette is resolved once per
 * pet from its appearance, so a recolour never touches the geometry.
 */
type FillSlot =
  | 'body'
  | 'bodyDark'
  | 'bodyLight'
  | 'belly'
  | 'inner'
  | 'ink'
  | 'blush'
  | 'accent'
  | 'iris'
  | 'white'
  | 'shadow';

interface EllipseShape {
  kind: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill: FillSlot;
  /** Degrees, around the ellipse centre. */
  rotate?: number;
  opacity?: number;
}

interface PathShape {
  kind: 'path';
  d: string;
  fill: FillSlot;
  opacity?: number;
}

type Shape = EllipseShape | PathShape;

/**
 * Each group is its own SVG layer stacked over the others, so an animation
 * moves a whole layer with a native transform. Geometry inside a layer never
 * changes — that is what keeps the pet off the JS thread.
 */
type GroupId =
  | 'shadow'
  | 'tail'
  | 'body'
  | 'ears'
  | 'head'
  | 'eyes'
  | 'overlay';

/** Layer order, back to front. */
const GROUP_ORDER: GroupId[] = [
  'shadow',
  'tail',
  'body',
  'ears',
  'head',
  'eyes',
  'overlay',
];

/** Everything is drawn in a 300×300 box; `y` grows downwards. */
const CANVAS = 300;

interface PetGeometry {
  shapes: Record<GroupId, Shape[]>;
  /** Rotation origin per layer, in canvas units — ears swivel at their base. */
  pivots: Partial<Record<GroupId, [number, number]>>;
}

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

export const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: FillSlot,
  extra: Partial<
    Omit<EllipseShape, 'kind' | 'cx' | 'cy' | 'rx' | 'ry' | 'fill'>
  > = {},
): EllipseShape => ({ kind: 'ellipse', cx, cy, rx, ry, fill, ...extra });

export const path = (
  d: string,
  fill: FillSlot,
  extra: Partial<Omit<PathShape, 'kind' | 'd' | 'fill'>> = {},
): PathShape => ({ kind: 'path', d, fill, ...extra });

export type { EllipseShape, FillSlot, GroupId, PathShape, PetGeometry, Shape };
export { CANVAS, GROUP_ORDER };
