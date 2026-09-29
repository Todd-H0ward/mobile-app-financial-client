import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Shape,
} from 'three';

import {
  SCENE_GEAR_PITCH_RADIUS,
  SCENE_GEAR_TEETH,
  SCENE_GEAR_TOOTH_PHASE,
} from '@/entities/scene';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

// Everything is in the hub's frame: x out from the hub along the radial, y up, z along the
// axle. The wheel is a disc in the x-y plane, 80 thick, teeth from 139 to 161 out.

/** Front of the column, the side facing the pit. Well inside the tooth tips (161), so the wheel sinks into the channel. */
const COLUMN_FRONT_X = 110;

/** Back of the column, away from the pit. */
const COLUMN_BACK_X = 400;

/** Half the column's width across the axle. */
const COLUMN_HALF_WIDTH = 130;

/** Half the channel's width — the wheel (40) and the rack (48) run in it with a little air. */
const CHANNEL_HALF_WIDTH = 56;

/** Rack teeth tips, out from the hub: just clear of the wheel's roots (139). */
const RACK_TIP_X = 142;

/** Rack teeth roots: just clear of the wheel's tips (161). */
const RACK_ROOT_X = 163;

/** The floor of the channel — the back of the rack's plate. */
const CHANNEL_FLOOR_X = 182;

/** The rack across the axle, a little narrower than the channel. */
const RACK_HALF_WIDTH = 48;

/** Distance between two teeth along the rack — the wheel's own, or they would not mesh. */
const RACK_PITCH = (2 * Math.PI * SCENE_GEAR_PITCH_RADIUS) / SCENE_GEAR_TEETH;

/** Half a tooth across its tip and across its root, as a share of the pitch. */
const TOOTH_TIP_HALF = 0.16;
const TOOTH_ROOT_HALF = 0.3;

/**
 * Ends of the column, relative to the hub. Far past the frame both ways so it reads as a
 * shaft with no ends; the top is longer because the column slides down while we climb.
 */
const COLUMN_BOTTOM = -2200;
const COLUMN_TOP = 3000;

/**
 * One pour of concrete between two formwork joints. The joints give the column a scale and
 * show it moving: a plain box sliding past the camera looks like it stands still.
 */
const POUR_HEIGHT = 300;

/** How tall a joint is and how deep it is cut into each face. */
const JOINT_HEIGHT = 14;
const JOINT_DEPTH = 8;

/** Vertex-colour factor in a joint — the shadow a real recess would hold. */
const JOINT_SHADE = 0.45;

/** The channel's floor sits in the column's own shadow. */
const CHANNEL_SHADE = 0.6;

/**
 * Tone of each pour, cycled up the column. No two batches of concrete set the same shade,
 * and a column of one flat tone is what reads as a plastic prop.
 */
const POUR_SHADES = [1, 0.9, 0.96, 0.86, 0.93];

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** A block of the column's section: x and z extents. */
interface Block {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** Extra shade on top of the pour's own. */
  shade: number;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** The section: two cheeks either side of the channel and the wall behind it. */
const BLOCKS: Block[] = [
  {
    x0: COLUMN_FRONT_X,
    x1: COLUMN_BACK_X,
    z0: CHANNEL_HALF_WIDTH,
    z1: COLUMN_HALF_WIDTH,
    shade: 1,
  },
  {
    x0: COLUMN_FRONT_X,
    x1: COLUMN_BACK_X,
    z0: -COLUMN_HALF_WIDTH,
    z1: -CHANNEL_HALF_WIDTH,
    shade: 1,
  },
  {
    x0: CHANNEL_FLOOR_X,
    x1: COLUMN_BACK_X,
    z0: -CHANNEL_HALF_WIDTH,
    z1: CHANNEL_HALF_WIDTH,
    shade: CHANNEL_SHADE,
  },
];

/** One block from `bottom` to `top`, shrunk by `inset` on every side, tinted by `shade`. */
const slab = (
  block: Block,
  bottom: number,
  top: number,
  inset: number,
  shade: number,
): BufferGeometry => {
  const width = block.x1 - block.x0 - inset * 2;
  const depth = block.z1 - block.z0 - inset * 2;
  const box = new BoxGeometry(width, top - bottom, depth).toNonIndexed();
  box.translate(
    (block.x0 + block.x1) / 2,
    (bottom + top) / 2,
    (block.z0 + block.z1) / 2,
  );
  const colors = new Float32Array(box.getAttribute('position').count * 3);
  colors.fill(shade);
  box.setAttribute('color', new BufferAttribute(colors, 3));
  return box;
};

/** Concatenates flat-shaded parts into one buffer — the column stays one draw call. */
const merge = (parts: BufferGeometry[]): BufferGeometry => {
  const merged = new BufferGeometry();
  for (const name of ['position', 'normal', 'color']) {
    const total = parts.reduce(
      (sum, part) => sum + part.getAttribute(name).array.length,
      0,
    );
    const values = new Float32Array(total);
    let at = 0;
    for (const part of parts) {
      const array = part.getAttribute(name).array as Float32Array;
      values.set(array, at);
      at += array.length;
    }
    merged.setAttribute(name, new BufferAttribute(values, 3));
  }
  for (const part of parts) part.dispose();
  return merged;
};

/**
 * The concrete of one column: a channel down the middle of the face towards the pit, deep
 * enough that the wheel's rim runs inside it. Carries its own vertex colours (the joints
 * and the channel are shaded) — do not refill them.
 */
export const buildColumnGeometry = (): BufferGeometry => {
  const parts: BufferGeometry[] = [];

  let pour = 0;
  for (let bottom = COLUMN_BOTTOM; bottom < COLUMN_TOP; bottom += POUR_HEIGHT) {
    const top = Math.min(bottom + POUR_HEIGHT, COLUMN_TOP);
    const tone = POUR_SHADES[pour % POUR_SHADES.length];
    pour += 1;
    for (const block of BLOCKS) {
      parts.push(
        slab(block, bottom, top - JOINT_HEIGHT, 0, tone * block.shade),
      );
      // Narrower, so it shows as a recessed band on every face.
      parts.push(
        slab(
          block,
          top - JOINT_HEIGHT,
          top,
          JOINT_DEPTH,
          JOINT_SHADE * block.shade,
        ),
      );
    }
  }

  return merge(parts);
};

/**
 * The toothed rack on the channel's floor. A wheel tooth stands at `SCENE_GEAR_TOOTH_PHASE`
 * above the radial at rest, so a gap is cut there and the teeth are laid a half pitch either
 * side of it — the two mesh for the whole climb because the column moves by the wheel's arc.
 */
export const buildRackGeometry = (): BufferGeometry => {
  const gap = SCENE_GEAR_PITCH_RADIUS * SCENE_GEAR_TOOTH_PHASE;
  const first = Math.ceil((COLUMN_BOTTOM - gap) / RACK_PITCH);
  const last = Math.floor((COLUMN_TOP - gap) / RACK_PITCH) - 1;

  const shape = new Shape();
  shape.moveTo(CHANNEL_FLOOR_X, COLUMN_BOTTOM);
  shape.lineTo(CHANNEL_FLOOR_X, COLUMN_TOP);
  shape.lineTo(RACK_ROOT_X, COLUMN_TOP);

  // Down the toothed face, top first, so the outline never crosses itself.
  for (let tooth = last; tooth >= first; tooth -= 1) {
    const centre = gap + (tooth + 0.5) * RACK_PITCH;
    shape.lineTo(RACK_ROOT_X, centre + TOOTH_ROOT_HALF * RACK_PITCH);
    shape.lineTo(RACK_TIP_X, centre + TOOTH_TIP_HALF * RACK_PITCH);
    shape.lineTo(RACK_TIP_X, centre - TOOTH_TIP_HALF * RACK_PITCH);
    shape.lineTo(RACK_ROOT_X, centre - TOOTH_ROOT_HALF * RACK_PITCH);
  }

  shape.lineTo(RACK_ROOT_X, COLUMN_BOTTOM);
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, {
    depth: RACK_HALF_WIDTH * 2,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, -RACK_HALF_WIDTH);
  return geometry;
};
