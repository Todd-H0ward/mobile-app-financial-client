import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

import {
  type ArenaLayout,
  cellArcOf,
  SCENE_GEAR_ANGLES,
  type SceneCell,
  type SceneTileRing,
} from '@/entities/scene';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** A piece of ring: headings in degrees, `from < to`, and the ring it is cut from. */
interface RingArc {
  /** Heading of the first edge, degrees, `atan2(x, z)` like the camera. */
  from: number;
  /** Heading of the last edge — always past `from`. */
  to: number;
  /** Radii and heights of the terrace it belongs to. */
  ring: SceneTileRing;
}

/** A merged buffer and where each part's vertices landed in it. */
interface MergedParts {
  geometry: BufferGeometry;
  /** Per part, the float range of its positions — what a sinking cell moves. */
  ranges: { from: number; to: number }[];
  /** Per part, the first triangle — what turns a ray hit back into a part. */
  starts: number[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Widest facet an arc is drawn with, in degrees. */
const MAX_FACET_DEG = 8.6;

/** Share of a cell the hold fill leaves as a margin on every side. */
const HOLD_INSET = 0.06;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const at = (heading: number, radius: number, y: number): Vector3 => {
  const radians = toRadians(heading);
  return new Vector3(Math.sin(radians) * radius, y, Math.cos(radians) * radius);
};

/** The headings an arc is cut at, ends included. */
const headingsOf = (from: number, to: number): number[] => {
  const facets = Math.max(1, Math.ceil((to - from) / MAX_FACET_DEG));
  return Array.from(
    { length: facets + 1 },
    (_, index) => from + ((to - from) * index) / facets,
  );
};

/** Where a cell of a layout lies on its ring, as headings, with the ring. */
const cellArc = (
  layout: ArenaLayout,
  cell: SceneCell,
  ring: SceneTileRing,
): RingArc | null => {
  const arc = cellArcOf(layout, cell);
  return arc ? { ...arc, ring } : null;
};

/**
 * A whole ring, gear to gear and round again — what the platform ring and a step with
 * nothing on it are drawn as.
 */
const fullArc = (ring: SceneTileRing): RingArc => {
  const start = SCENE_GEAR_ANGLES[0] ?? 0;
  return { from: start, to: start + 360, ring };
};

/** A block of ring as triangles with flat normals: top, both risers and ends. */
const arcSolid = ({ from, to, ring }: RingArc): BufferGeometry => {
  const position: number[] = [];
  const normal: number[] = [];

  const quad = (a: Vector3, b: Vector3, c: Vector3, d: Vector3, n: Vector3) => {
    for (const point of [a, b, c, a, c, d]) {
      position.push(point.x, point.y, point.z);
      normal.push(n.x, n.y, n.z);
    }
  };

  const headings = headingsOf(from, to);
  const up = new Vector3(0, 1, 0);

  for (let index = 0; index < headings.length - 1; index += 1) {
    const a = headings[index];
    const b = headings[index + 1];
    const middle = toRadians((a + b) / 2);
    const outward = new Vector3(Math.sin(middle), 0, Math.cos(middle));
    const inward = outward.clone().negate();

    // Top face.
    quad(
      at(a, ring.inner, ring.top),
      at(a, ring.outer, ring.top),
      at(b, ring.outer, ring.top),
      at(b, ring.inner, ring.top),
      up,
    );
    // Inner riser — the wall the child faces across the pit.
    quad(
      at(a, ring.inner, ring.bottom),
      at(a, ring.inner, ring.top),
      at(b, ring.inner, ring.top),
      at(b, ring.inner, ring.bottom),
      inward,
    );
    // Outer riser — hidden behind the next ring, except on the rim.
    quad(
      at(b, ring.outer, ring.bottom),
      at(b, ring.outer, ring.top),
      at(a, ring.outer, ring.top),
      at(a, ring.outer, ring.bottom),
      outward,
    );
  }

  // The two ends: seen in the gear slots and whenever a neighbour sinks.
  for (const [heading, sign] of [
    [from, -1],
    [to, 1],
  ] as const) {
    const radians = toRadians(heading);
    const side = new Vector3(
      Math.cos(radians),
      0,
      -Math.sin(radians),
    ).multiplyScalar(sign);
    quad(
      at(heading, ring.inner, ring.bottom),
      at(heading, ring.outer, ring.bottom),
      at(heading, ring.outer, ring.top),
      at(heading, ring.inner, ring.top),
      side,
    );
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(position), 3),
  );
  geometry.setAttribute(
    'normal',
    new BufferAttribute(new Float32Array(normal), 3),
  );
  return geometry;
};

/** The outline of a block of ring, lifted clear of it. */
const arcEdges = (
  { from, to, ring }: RingArc,
  lift: number,
): BufferGeometry => {
  const position: number[] = [];
  const line = (a: Vector3, b: Vector3) => {
    position.push(a.x, a.y + lift, a.z, b.x, b.y + lift, b.z);
  };

  const headings = headingsOf(from, to);
  for (let index = 0; index < headings.length - 1; index += 1) {
    const a = headings[index];
    const b = headings[index + 1];
    for (const radius of [ring.inner, ring.outer]) {
      line(at(a, radius, ring.top), at(b, radius, ring.top));
      line(at(a, radius, ring.bottom), at(b, radius, ring.bottom));
    }
  }
  for (const heading of [from, to]) {
    line(at(heading, ring.inner, ring.top), at(heading, ring.outer, ring.top));
    for (const radius of [ring.inner, ring.outer]) {
      line(at(heading, radius, ring.bottom), at(heading, radius, ring.top));
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(position), 3),
  );
  return geometry;
};

/** The block that rises inside a held cell, `0 … 1` tall. */
const holdSolid = ({ from, to, ring }: RingArc): BufferGeometry => {
  const arcInset = (to - from) * HOLD_INSET;
  const radialInset = (ring.outer - ring.inner) * HOLD_INSET;
  return arcSolid({
    from: from + arcInset,
    to: to - arcInset,
    ring: {
      inner: ring.inner + radialInset,
      outer: ring.outer - radialInset,
      bottom: 0,
      top: 1,
      slotted: ring.slotted,
    },
  });
};

/** Where a cell's number sits: the middle of its top face, a hair above it. */
const arcAnchor = ({ from, to, ring }: RingArc, lift: number): Vector3 =>
  at((from + to) / 2, (ring.inner + ring.outer) / 2, ring.top + lift);

/** Lays several parts into one buffer, end to end. */
const mergeParts = (
  parts: BufferGeometry[],
  colors?: readonly (readonly [number, number, number])[],
): MergedParts => {
  const flat = parts.map((part) => (part.index ? part.toNonIndexed() : part));
  const total = flat.reduce(
    (sum, part) => sum + (part.getAttribute('position')?.array.length ?? 0),
    0,
  );
  const hasNormals = flat.every((part) => part.getAttribute('normal'));

  const position = new Float32Array(total);
  const normal = hasNormals ? new Float32Array(total) : null;
  const color = new Float32Array(total).fill(1);
  const ranges: { from: number; to: number }[] = [];
  const starts: number[] = [];

  let offset = 0;
  flat.forEach((part, index) => {
    const source = part.getAttribute('position');
    const length = source?.array.length ?? 0;
    if (source) position.set(source.array as Float32Array, offset);
    if (normal) {
      normal.set(part.getAttribute('normal').array as Float32Array, offset);
    }
    const tint = colors?.[index];
    if (tint) {
      for (let i = offset; i < offset + length; i += 3) {
        color[i] = tint[0];
        color[i + 1] = tint[1];
        color[i + 2] = tint[2];
      }
    }
    ranges.push({ from: offset, to: offset + length });
    starts.push(offset / 9);
    offset += length;
  });

  for (const [index, part] of flat.entries()) {
    if (part !== parts[index]) part.dispose();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  if (normal) geometry.setAttribute('normal', new BufferAttribute(normal, 3));
  geometry.setAttribute('color', new BufferAttribute(color, 3));
  geometry.computeBoundingSphere();
  return { geometry, ranges, starts };
};

export type { MergedParts, RingArc };
export {
  arcAnchor,
  arcEdges,
  arcSolid,
  cellArc,
  fullArc,
  holdSolid,
  mergeParts,
};
