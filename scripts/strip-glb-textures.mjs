#!/usr/bin/env node
// Strips embedded textures out of a GLB, leaving geometry and animation.
//
//   node scripts/strip-glb-textures.mjs <in.glb> <out.glb>
//
// The app dresses the robot dog from loose PNG files, because expo-gl uploads
// a texture by handing the native side a `file://` path and a picture packed
// inside the model is bytes in memory, not a file. The embedded copies are
// therefore dead weight — three and a half megabytes per coat that also make
// GLTFLoader log a failure for every one of them.
//
// All seven coats share this geometry, so one stripped file replaces all of
// them: 36 MB of assets become 1.4 MB plus the albedo the app actually uses.

import { readFileSync, writeFileSync } from 'node:fs';

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const readGlb = (path) => {
  const buf = readFileSync(path);
  let offset = 12;
  let json = null;
  let bin = null;

  while (offset < buf.length) {
    const length = buf.readUInt32LE(offset);
    const type = buf.readUInt32LE(offset + 4);
    const body = buf.subarray(offset + 8, offset + 8 + length);

    if (type === JSON_CHUNK) json = JSON.parse(body.toString('utf8'));
    if (type === BIN_CHUNK) bin = Buffer.from(body);
    offset += 8 + length + ((4 - (length % 4)) % 4);
  }

  return { json, bin };
};

const pad = (buf, filler) => {
  const remainder = buf.length % 4;
  if (remainder === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - remainder, filler)]);
};

const writeGlb = (path, json, bin) => {
  const jsonChunk = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const binChunk = pad(bin, 0);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(JSON_CHUNK, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(BIN_CHUNK, 4);

  writeFileSync(
    path,
    Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]),
  );
};

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: strip-glb-textures.mjs <in.glb> <out.glb>');
  process.exit(1);
}

const { json, bin } = readGlb(input);
if (!json || !bin) {
  console.error('not a GLB with both a JSON and a BIN chunk');
  process.exit(1);
}

const imageCount = json.images?.length ?? 0;

// Every material loses its maps; the flat colours the artist set stay, and the
// app paints the albedo back on from a file.
for (const material of json.materials ?? []) {
  const pbr = material.pbrMetallicRoughness;
  if (pbr) {
    delete pbr.baseColorTexture;
    delete pbr.metallicRoughnessTexture;
  }
  delete material.normalTexture;
  delete material.occlusionTexture;
  delete material.emissiveTexture;
}

delete json.images;
delete json.textures;
delete json.samplers;

// Whatever the accessors still point at is geometry and animation; anything
// else in the binary chunk belonged to a picture nobody reads any more.
const kept = new Set();
for (const accessor of json.accessors ?? []) {
  if (accessor.bufferView !== undefined) kept.add(accessor.bufferView);
  if (accessor.sparse) {
    kept.add(accessor.sparse.indices.bufferView);
    kept.add(accessor.sparse.values.bufferView);
  }
}

const remap = new Map();
const views = [];
const chunks = [];
let cursor = 0;

for (const [index, view] of (json.bufferViews ?? []).entries()) {
  if (!kept.has(index)) continue;

  const start = view.byteOffset ?? 0;
  const slice = bin.subarray(start, start + view.byteLength);
  // Accessors read typed arrays straight out of here, so every view has to
  // start on a four-byte boundary or the reader throws.
  const padding = (4 - (cursor % 4)) % 4;
  if (padding > 0) {
    chunks.push(Buffer.alloc(padding));
    cursor += padding;
  }

  remap.set(index, views.length);
  views.push({ ...view, byteOffset: cursor });
  chunks.push(slice);
  cursor += slice.length;
}

for (const accessor of json.accessors ?? []) {
  if (accessor.bufferView !== undefined) {
    accessor.bufferView = remap.get(accessor.bufferView);
  }
  if (accessor.sparse) {
    accessor.sparse.indices.bufferView = remap.get(
      accessor.sparse.indices.bufferView,
    );
    accessor.sparse.values.bufferView = remap.get(
      accessor.sparse.values.bufferView,
    );
  }
}

json.bufferViews = views;
const stripped = Buffer.concat(chunks);
json.buffers = [{ byteLength: stripped.length }];

writeGlb(output, json, stripped);

const before = readFileSync(input).length;
const after = readFileSync(output).length;
console.log(
  `${output}: ${(before / 1048576).toFixed(2)} MB → ${(after / 1048576).toFixed(2)} MB, ${imageCount} textures removed`,
);
