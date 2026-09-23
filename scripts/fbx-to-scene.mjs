#!/usr/bin/env node
// Turns the C4D export in assets/scene into the compact JSON the app renders.
//
// The app ships no FBX loader: FBXLoader drags in fflate, NURBS and a parser
// that dwarfs this 200KB scene. The geometry never changes at runtime, so it
// is triangulated here, once, and checked in next to the source.
//
//   node scripts/fbx-to-scene.mjs
//
// Output: assets/scene/scene.json — unique geometries plus one world matrix
// per instance, so the 119 cloned discs stay 33 buffers.

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(ROOT, 'assets/scene/сцена.fbx');
const TARGET = resolve(ROOT, 'assets/scene/scene.json');

// ═══════════════════════════════════════════
// BINARY FBX PARSER
// ═══════════════════════════════════════════

const parse = (buffer) => {
  const version = buffer.readUInt32LE(23);
  const wide = version >= 7500;
  let cursor = 27;

  const readNode = () => {
    const end = wide ? Number(buffer.readBigUInt64LE(cursor)) : buffer.readUInt32LE(cursor);
    const count = wide ? Number(buffer.readBigUInt64LE(cursor + 8)) : buffer.readUInt32LE(cursor + 4);
    cursor += wide ? 24 : 12;
    const nameLength = buffer.readUInt8(cursor);
    cursor += 1;
    const name = buffer.toString('utf8', cursor, cursor + nameLength);
    cursor += nameLength;

    // A zero end offset is the sentinel that closes a list of children.
    if (end === 0) return null;

    const props = [];
    for (let i = 0; i < count; i += 1) props.push(readProperty());

    const children = [];
    while (cursor < end) {
      const child = readNode();
      if (child === null) break;
      children.push(child);
    }
    cursor = end;

    return { name, props, children };
  };

  const readProperty = () => {
    const type = String.fromCharCode(buffer.readUInt8(cursor));
    cursor += 1;

    switch (type) {
      case 'C': {
        const value = buffer.readUInt8(cursor) !== 0;
        cursor += 1;
        return value;
      }
      case 'Y': {
        const value = buffer.readInt16LE(cursor);
        cursor += 2;
        return value;
      }
      case 'I': {
        const value = buffer.readInt32LE(cursor);
        cursor += 4;
        return value;
      }
      case 'F': {
        const value = buffer.readFloatLE(cursor);
        cursor += 4;
        return value;
      }
      case 'D': {
        const value = buffer.readDoubleLE(cursor);
        cursor += 8;
        return value;
      }
      case 'L': {
        const value = Number(buffer.readBigInt64LE(cursor));
        cursor += 8;
        return value;
      }
      case 'S':
      case 'R': {
        const length = buffer.readUInt32LE(cursor);
        cursor += 4;
        const slice = buffer.subarray(cursor, cursor + length);
        cursor += length;
        // FBX joins the name and the class of an object with \0\x01.
        return type === 'S' ? slice.toString('utf8').replace(/\0\x01/g, '::') : slice;
      }
      default:
        return readArray(type);
    }
  };

  const readArray = (type) => {
    const length = buffer.readUInt32LE(cursor);
    const encoding = buffer.readUInt32LE(cursor + 4);
    const compressed = buffer.readUInt32LE(cursor + 8);
    cursor += 12;
    let data = buffer.subarray(cursor, cursor + compressed);
    cursor += compressed;
    if (encoding === 1) data = inflateSync(data);

    const stride = { f: 4, i: 4, d: 8, l: 8, b: 1 }[type];
    const out = new Array(length);
    for (let i = 0; i < length; i += 1) {
      const at = i * stride;
      if (type === 'f') out[i] = data.readFloatLE(at);
      else if (type === 'd') out[i] = data.readDoubleLE(at);
      else if (type === 'i') out[i] = data.readInt32LE(at);
      else if (type === 'l') out[i] = Number(data.readBigInt64LE(at));
      else out[i] = data.readUInt8(at) !== 0;
    }
    return out;
  };

  const root = [];
  while (cursor < buffer.length - 160) {
    const node = readNode();
    if (node === null) break;
    root.push(node);
  }
  return { version, root };
};

// ═══════════════════════════════════════════
// MATRIX MATH (column-major, like three)
// ═══════════════════════════════════════════

const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const multiply = (a, b) => {
  const out = new Array(16);
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[col * 4 + row] =
        a[row] * b[col * 4] +
        a[4 + row] * b[col * 4 + 1] +
        a[8 + row] * b[col * 4 + 2] +
        a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
};

const translation = ([x, y, z]) => {
  const m = identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
};

const scaling = ([x, y, z]) => {
  const m = identity();
  m[0] = x;
  m[5] = y;
  m[10] = z;
  return m;
};

const RAD = Math.PI / 180;

/**
 * FBX's default rotation order is eEulerXYZ — X applied first — which as a
 * matrix is Rz·Ry·Rx. Getting this backwards mirrors the whole scene.
 */
const rotation = ([x, y, z]) => {
  const [sx, cx] = [Math.sin(x * RAD), Math.cos(x * RAD)];
  const [sy, cy] = [Math.sin(y * RAD), Math.cos(y * RAD)];
  const [sz, cz] = [Math.sin(z * RAD), Math.cos(z * RAD)];

  const rx = identity();
  rx[5] = cx; rx[6] = sx; rx[9] = -sx; rx[10] = cx;
  const ry = identity();
  ry[0] = cy; ry[2] = -sy; ry[8] = sy; ry[10] = cy;
  const rz = identity();
  rz[0] = cz; rz[1] = sz; rz[4] = -sz; rz[5] = cz;

  return multiply(multiply(rz, ry), rx);
};

const applyMatrix = (m, [x, y, z]) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

// ═══════════════════════════════════════════
// SCENE GRAPH
// ═══════════════════════════════════════════

const propertiesOf = (node) => {
  const bag = node.children.find((child) => child.name === 'Properties70');
  const out = new Map();
  for (const entry of bag?.children ?? []) {
    out.set(entry.props[0], entry.props.slice(4));
  }
  return out;
};

const vector = (properties, key, fallback) => {
  const value = properties.get(key);
  return value ? [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0] : fallback;
};

/** T · Roff · Rp · Rpre · R · Rpost⁻¹ · Rp⁻¹ · Soff · Sp · S · Sp⁻¹ */
const localMatrix = (properties) => {
  const rotationPivot = vector(properties, 'RotationPivot', [0, 0, 0]);
  const scalingPivot = vector(properties, 'ScalingPivot', [0, 0, 0]);
  const negate = (v) => v.map((n) => -n);

  return [
    translation(vector(properties, 'Lcl Translation', [0, 0, 0])),
    translation(vector(properties, 'RotationOffset', [0, 0, 0])),
    translation(rotationPivot),
    rotation(vector(properties, 'PreRotation', [0, 0, 0])),
    rotation(vector(properties, 'Lcl Rotation', [0, 0, 0])),
    rotation(negate(vector(properties, 'PostRotation', [0, 0, 0]))),
    translation(negate(rotationPivot)),
    translation(vector(properties, 'ScalingOffset', [0, 0, 0])),
    translation(scalingPivot),
    scaling(vector(properties, 'Lcl Scaling', [1, 1, 1])),
    translation(negate(scalingPivot)),
  ].reduce(multiply);
};

const geometricMatrix = (properties) =>
  [
    translation(vector(properties, 'GeometricTranslation', [0, 0, 0])),
    rotation(vector(properties, 'GeometricRotation', [0, 0, 0])),
    scaling(vector(properties, 'GeometricScaling', [1, 1, 1])),
  ].reduce(multiply);

// ═══════════════════════════════════════════
// GEOMETRY
// ═══════════════════════════════════════════

const layerOf = (geometry, name) => {
  const layer = geometry.children.find((child) => child.name === name);
  if (!layer) return null;
  const pick = (key) => layer.children.find((child) => child.name === key)?.props[0];
  return {
    mapping: pick('MappingInformationType'),
    reference: pick('ReferenceInformationType'),
    data: pick(name === 'LayerElementNormal' ? 'Normals' : 'UV'),
    index: pick(name === 'LayerElementNormal' ? 'NormalsIndex' : 'UVIndex'),
  };
};

/** Triangulates a polygon fan and bakes normals into a flat, non-indexed buffer. */
const buildGeometry = (geometry) => {
  const vertices = geometry.children.find((child) => child.name === 'Vertices')?.props[0] ?? [];
  const indices =
    geometry.children.find((child) => child.name === 'PolygonVertexIndex')?.props[0] ?? [];
  const normals = layerOf(geometry, 'LayerElementNormal');

  const normalAt = (polygonVertex, vertexIndex) => {
    if (!normals?.data) return null;
    let at = normals.mapping === 'ByVertice' ? vertexIndex : polygonVertex;
    if (normals.reference === 'IndexToDirect') at = normals.index?.[at] ?? at;
    return [normals.data[at * 3], normals.data[at * 3 + 1], normals.data[at * 3 + 2]];
  };

  const position = [];
  const normal = [];
  let polygon = [];

  const flush = () => {
    for (let i = 1; i + 1 < polygon.length; i += 1) {
      for (const corner of [polygon[0], polygon[i], polygon[i + 1]]) {
        position.push(...corner.position);
        normal.push(...corner.normal);
      }
    }
    polygon = [];
  };

  for (let i = 0; i < indices.length; i += 1) {
    const raw = indices[i];
    // A negative index, bit-flipped, marks the last corner of the polygon.
    const last = raw < 0;
    const vertexIndex = last ? ~raw : raw;
    polygon.push({
      position: [vertices[vertexIndex * 3], vertices[vertexIndex * 3 + 1], vertices[vertexIndex * 3 + 2]],
      normal: normalAt(i, vertexIndex) ?? [0, 1, 0],
    });
    if (last) flush();
  }
  if (polygon.length) flush();

  return { position, normal };
};

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════

const { version, root } = parse(readFileSync(SOURCE));
const top = Object.fromEntries(root.map((node) => [node.name, node]));

const objects = new Map();
for (const node of top.Objects.children) {
  if (typeof node.props[0] === 'number') objects.set(node.props[0], node);
}

const childrenOf = new Map();
for (const link of top.Connections.children) {
  if (link.props[0] !== 'OO') continue;
  const [, source, target] = link.props;
  if (!childrenOf.has(target)) childrenOf.set(target, []);
  childrenOf.get(target).push(source);
}

const nameOf = (node) => String(node.props[1] ?? '').split('::')[0];

const geometries = [];
const geometryIndex = new Map();
const nodes = [];
const segmentAngles = [];
const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
/** Radius of the sphere around the origin that holds every vertex. */
let sphereRadius = 0;

const grow = (point) => {
  for (let axis = 0; axis < 3; axis += 1) {
    bounds.min[axis] = Math.min(bounds.min[axis], point[axis]);
    bounds.max[axis] = Math.max(bounds.max[axis], point[axis]);
  }
  sphereRadius = Math.max(sphereRadius, Math.hypot(point[0], point[1], point[2]));
};

const round = (value, digits) => Number(value.toFixed(digits));

/**
 * The nulls that hold one tier of discs are named `1`…`5` in Cinema 4D, and
 * the cloner suffixes its copies (`1_2`, `5_3`). The digit is the tier, and it
 * is the only thing in the file that says which discs move together.
 */
const stepOf = (node) => {
  const match = /^([1-5])(_\d+)?$/.exec(nameOf(node));
  return match ? Number(match[1]) - 1 : null;
};

const walk = (id, parentMatrix, parentStep) => {
  const node = objects.get(id);
  if (!node || node.name !== 'Model') return;

  const properties = propertiesOf(node);
  const world = multiply(parentMatrix, localMatrix(properties));
  const step = stepOf(node) ?? parentStep;

  if (node.props[2] === 'Mesh') {
    const geometry = (childrenOf.get(id) ?? [])
      .map((childId) => objects.get(childId))
      .find((child) => child?.name === 'Geometry');

    if (geometry) {
      const geometryId = geometry.props[0];
      if (!geometryIndex.has(geometryId)) {
        geometryIndex.set(geometryId, geometries.length);
        geometries.push(buildGeometry(geometry));
      }
      const matrix = multiply(world, geometricMatrix(properties));
      const built = geometries[geometryIndex.get(geometryId)];
      const centroid = [0, 0, 0];
      const count = built.position.length / 3;
      for (let i = 0; i < built.position.length; i += 3) {
        const point = applyMatrix(matrix, built.position.slice(i, i + 3));
        grow(point);
        centroid[0] += point[0] / count;
        centroid[1] += point[1] / count;
        centroid[2] += point[2] / count;
      }
      nodes.push({
        geometry: geometryIndex.get(geometryId),
        segment: -1,
        step,
        centroid,
        matrix: matrix.map((value) => round(value, 4)),
      });
    }
  }

  for (const childId of childrenOf.get(id) ?? []) walk(childId, world, step);
};

// The three lofts are the segments: their azimuth around Y is where the
// camera parks when the child walks into that room.
const roots = (childrenOf.get(0) ?? []).map((id) => objects.get(id)).filter(Boolean);
const cloner = roots.find((node) => nameOf(node) === 'Cloner');
const lofts = (childrenOf.get(cloner.props[0]) ?? []).map((id) => objects.get(id));

const azimuthOf = (x, z) => ((Math.atan2(x, z) * 180) / Math.PI + 360) % 360;

const loftAngles = lofts
  .map((node) => {
    const [x, , z] = vector(propertiesOf(node), 'Lcl Translation', [0, 0, 0]);
    return azimuthOf(x, z);
  })
  .sort((a, b) => a - b);

for (const node of roots) {
  if (node.props[2] === 'Camera') continue;
  walk(node.props[0], identity(), -1);
}

/**
 * A mesh belongs to the room it stands in, read off the angle of its own
 * centroid. The clone roots cannot say: a cloner rotates its clones and leaves
 * every translation at zero, so all 90 discs would land in one room.
 */
const nearestSegment = (centroid) => {
  const radius = Math.hypot(centroid[0], centroid[2]);
  // Whatever sits on the axis belongs to no single room.
  if (radius < 1) return -1;

  const angle = azimuthOf(centroid[0], centroid[2]);
  let best = -1;
  let bestDistance = Infinity;
  loftAngles.forEach((loftAngle, index) => {
    const distance = Math.abs(((angle - loftAngle + 540) % 360) - 180);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
};

for (const node of nodes) {
  node.segment = nearestSegment(node.centroid);
  delete node.centroid;
}

for (const angle of loftAngles) segmentAngles.push(round(angle, 3));

const camera = roots.find((node) => node.props[2] === 'Camera');
const cameraPosition = camera
  ? vector(propertiesOf(camera), 'Lcl Translation', [0, 0, 0])
  : [0, 900, 1200];

// The tiers are the only thing in the scene built to move: read their count
// and spacing off the nodes rather than writing the numbers down twice.
const stepHeights = [
  ...new Set(
    nodes
      .filter((node) => node.step >= 0)
      .map((node) => Math.round(node.matrix[13])),
  ),
].sort((a, b) => a - b);

const STEP_COUNT = Math.max(...nodes.map((node) => node.step)) + 1;
const STEP_RISE =
  stepHeights.length > 1 ? stepHeights[1] - stepHeights[0] : 0;

const center = bounds.min.map((min, axis) => (min + bounds.max[axis]) / 2);
const radius =
  Math.max(...bounds.max.map((max, axis) => max - bounds.min[axis])) / 2;

const scene = {
  source: 'assets/scene/сцена.fbx',
  fbxVersion: version,
  bounds: {
    min: bounds.min.map((value) => round(value, 2)),
    max: bounds.max.map((value) => round(value, 2)),
    center: center.map((value) => round(value, 2)),
    radius: round(radius, 2),
    /** Everything fits inside this sphere around the origin — the camera's pivot. */
    sphereRadius: round(sphereRadius, 2),
  },
  camera: {
    /** Elevation of the C4D camera, in degrees above the floor. */
    elevation: round(
      (Math.atan2(cameraPosition[1], Math.hypot(cameraPosition[0], cameraPosition[2])) * 180) /
        Math.PI,
      2,
    ),
    distance: round(Math.hypot(...cameraPosition), 2),
  },
  segmentAngles,
  /** Tiers of discs that can be raised one by one; `-1` marks what cannot. */
  steps: {
    count: STEP_COUNT,
    /** Distance between two tiers, in world units. */
    rise: STEP_RISE,
  },
  geometries: geometries.map((geometry) => ({
    position: geometry.position.map((value) => round(value, 2)),
    normal: geometry.normal.map((value) => round(value, 4)),
  })),
  nodes,
};

writeFileSync(TARGET, `${JSON.stringify(scene)}\n`);

const triangles = nodes.reduce(
  (sum, node) => sum + geometries[node.geometry].position.length / 9,
  0,
);
console.log(
  `scene.json: ${geometries.length} geometries, ${nodes.length} nodes, ${triangles} triangles, segments at ${segmentAngles.join('° / ')}°, ${STEP_COUNT} steps every ${STEP_RISE} units`,
);
