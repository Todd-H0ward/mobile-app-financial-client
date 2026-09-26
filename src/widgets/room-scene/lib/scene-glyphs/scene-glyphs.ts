import {
  BufferAttribute,
  BufferGeometry,
  Path,
  Shape,
  ShapeGeometry,
  type Vector3,
} from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

import fontData from './helvetiker-bold.typeface.json';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Curve segments for bezier glyph outlines.
 *
 * Helvetiker strokes are smooth; too few and the counters of 8/0 go polygonal.
 */
const CURVE_SEGMENTS = 8;

/** Parsed once — every arena number and HUD board shares the same face. */
const SCENE_FONT = new FontLoader().parse(fontData);

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Real type outlines for `text`, sized so capitals sit at `height`.
 *
 * This is a filled font (outer rings + counters), not thickened stick strokes —
 * that is what makes arena numbers read as digits instead of bars.
 */
const layoutTextShapes = (text: string, height: number): Shape[] =>
  SCENE_FONT.generateShapes(text, height);

const geometryFromShapes = (shapes: Shape[]): BufferGeometry => {
  if (shapes.length === 0) return new BufferGeometry();
  return new ShapeGeometry(shapes, CURVE_SEGMENTS);
};

/** Shift glyph geometry so its bounding box is centred on the origin. */
const centerGeometry = (geometry: BufferGeometry) => {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;
  const position = geometry.getAttribute('position');
  if (!position) return;

  for (let i = 0; i < position.count; i += 1) {
    position.setXY(i, position.getX(i) - cx, position.getY(i) - cy);
  }
  position.needsUpdate = true;
};

/**
 * World-space filled geometry for a string on a horizontal plane.
 *
 * `origin` is the centre of the glyph box; `tangent` is local +X (reading
 * direction); `up` is local +Y (glyph top). Every vertex keeps `origin.y`
 * so the label sits flat on a cell top.
 */
const textGeometryOnPlane = (
  text: string,
  origin: Vector3,
  tangent: Vector3,
  up: Vector3,
  height: number,
): BufferGeometry => {
  const geometry = geometryFromShapes(layoutTextShapes(text, height));
  const position = geometry.getAttribute('position');
  if (!position) return geometry;

  centerGeometry(geometry);

  for (let i = 0; i < position.count; i += 1) {
    const lx = position.getX(i);
    const ly = position.getY(i);
    position.setXYZ(
      i,
      origin.x + tangent.x * lx + up.x * ly,
      origin.y,
      origin.z + tangent.z * lx + up.z * ly,
    );
  }

  position.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
};

/**
 * Filled geometry for a string in a local XY plane at a fixed Z.
 *
 * Used by the map HUD boards: ink floats just in front of the slab face.
 */
const textGeometryLocal = (
  text: string,
  originX: number,
  originY: number,
  height: number,
  z: number,
): BufferGeometry => {
  const geometry = geometryFromShapes(layoutTextShapes(text, height));
  const position = geometry.getAttribute('position');
  if (!position) return geometry;

  centerGeometry(geometry);

  for (let i = 0; i < position.count; i += 1) {
    position.setXYZ(
      i,
      originX + position.getX(i),
      originY + position.getY(i),
      z,
    );
  }

  position.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
};

/**
 * Gear mark used as the currency glyph on the coins board.
 *
 * Tooth outline + hub disc — filled so it matches the digit weight.
 */
const gearGeometryLocal = (
  cx: number,
  cy: number,
  outer: number,
  z: number,
): BufferGeometry => {
  const teeth = 8;
  const valley = outer * 0.72;
  const hub = outer * 0.28;
  const outline = new Shape();

  for (let i = 0; i < teeth * 2; i += 1) {
    const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : valley;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) outline.moveTo(x, y);
    else outline.lineTo(x, y);
  }
  outline.closePath();

  const hole = new Path();
  hole.absarc(cx, cy, hub, 0, Math.PI * 2, true);
  outline.holes.push(hole);

  const geometry = new ShapeGeometry(outline, CURVE_SEGMENTS);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    position.setZ(i, z);
  }
  position.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
};

/** Merge several geometries into one indexed mesh (disposes the parts). */
const mergeGeometries = (parts: BufferGeometry[]): BufferGeometry => {
  const usable = parts.filter((part) => part.getAttribute('position'));
  if (usable.length === 0) return new BufferGeometry();
  if (usable.length === 1) return usable[0];

  let floatCount = 0;
  for (const part of usable) {
    floatCount += part.getAttribute('position').count * 3;
  }

  const positions = new Float32Array(floatCount);
  const indices: number[] = [];
  let floatAt = 0;
  let vertexAt = 0;

  for (const part of usable) {
    const attribute = part.getAttribute('position');
    const array = attribute.array as Float32Array;
    positions.set(array, floatAt);

    const index = part.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i += 1) {
        indices.push(vertexAt + index.getX(i));
      }
    } else {
      for (let i = 0; i < attribute.count; i += 1) {
        indices.push(vertexAt + i);
      }
    }

    floatAt += array.length;
    vertexAt += attribute.count;
    part.dispose();
  }

  const merged = new BufferGeometry();
  merged.setAttribute('position', new BufferAttribute(positions, 3));
  merged.setIndex(indices);
  merged.computeBoundingSphere();
  return merged;
};

export {
  gearGeometryLocal,
  layoutTextShapes,
  mergeGeometries,
  textGeometryLocal,
  textGeometryOnPlane,
};
