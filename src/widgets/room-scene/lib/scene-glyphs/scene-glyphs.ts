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

const CURVE_SEGMENTS = 8;

/** Parsed once — every arena number and HUD board shares the same face. */
const SCENE_FONT = new FontLoader().parse(fontData);

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Real type outlines for `text`, sized so capitals sit at `height`. */
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

/** World-space filled geometry for a string on a horizontal plane. */
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

/** World-space filled geometry for a string standing upright on a wall. */
const textGeometryUpright = (
  text: string,
  origin: Vector3,
  right: Vector3,
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
      origin.x + right.x * lx,
      origin.y + ly,
      origin.z + right.z * lx,
    );
  }

  position.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
};

/** Filled geometry for a string in a local XY plane at a fixed Z. */
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

/** A shape laid flat at `z`, as filled geometry. */
const shapeGeometryAt = (shape: Shape, z: number): BufferGeometry => {
  const geometry = new ShapeGeometry(shape, CURVE_SEGMENTS);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    position.setZ(i, z);
  }
  position.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
};

/** The coin, as the HUD over the scene draws it: a disc with a slot down the middle. */
const coinGeometryLocal = (
  cx: number,
  cy: number,
  radius: number,
  z: number,
): BufferGeometry => {
  const disc = new Shape();
  disc.absarc(cx, cy, radius, 0, Math.PI * 2, false);

  const slotHalfWidth = radius * 0.18;
  const slotHalfHeight = radius * 0.5;
  const slot = new Path();
  slot.moveTo(cx - slotHalfWidth, cy - slotHalfHeight);
  slot.lineTo(cx - slotHalfWidth, cy + slotHalfHeight);
  slot.lineTo(cx + slotHalfWidth, cy + slotHalfHeight);
  slot.lineTo(cx + slotHalfWidth, cy - slotHalfHeight);
  slot.closePath();
  disc.holes.push(slot);

  return shapeGeometryAt(disc, z);
};

/** An upward chevron — the tier board's mark, the "подъём" the HUD words. */
const upGeometryLocal = (
  cx: number,
  cy: number,
  size: number,
  z: number,
): BufferGeometry => {
  const half = size / 2;
  const stroke = size * 0.3;
  const chevron = new Shape();
  chevron.moveTo(cx - half, cy - half * 0.35);
  chevron.lineTo(cx, cy + half * 0.65);
  chevron.lineTo(cx + half, cy - half * 0.35);
  chevron.lineTo(cx + half - stroke, cy - half * 0.35 - stroke * 0.6);
  chevron.lineTo(cx, cy + half * 0.65 - stroke * 1.2);
  chevron.lineTo(cx - half + stroke, cy - half * 0.35 - stroke * 0.6);
  chevron.closePath();
  return shapeGeometryAt(chevron, z);
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
  coinGeometryLocal,
  layoutTextShapes,
  mergeGeometries,
  textGeometryLocal,
  textGeometryOnPlane,
  textGeometryUpright,
  upGeometryLocal,
};
