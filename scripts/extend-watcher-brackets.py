"""Build supports in Blender and append them without re-exporting animation.

Run with Blender --background --python scripts/extend-watcher-brackets.py --
  --source-dir <original GLBs> --output-dir assets/scene/watchers
The source GLBs must be the unmodified artist exports. Existing materials and
animation buffers are preserved byte-for-byte; only support geometry is new.
"""

import argparse
import json
import struct
import sys
import tempfile
from pathlib import Path

import bpy
from mathutils import Vector


def read_glb(path):
    data = path.read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20 + size])
    offset = 20 + size
    bin_size, kind = struct.unpack_from('<II', data, offset)
    assert kind == 0x004E4942
    return doc, data[offset + 8:offset + 8 + bin_size]


def write_glb(path, doc, binary):
    text = json.dumps(doc, separators=(',', ':')).encode()
    text += b' ' * (-len(text) % 4)
    binary += b'\0' * (-len(binary) % 4)
    path.write_bytes(struct.pack('<III', 0x46546C67, 2, 28 + len(text) + len(binary))
                     + struct.pack('<II', len(text), 0x4E4F534A) + text
                     + struct.pack('<II', len(binary), 0x004E4942) + binary)


def xyz(point):
    # glTF Y-up -> Blender Z-up; the exporter reverses this conversion.
    return Vector((point[0], -point[2], point[1]))


def finish(obj, name, material, parts):
    obj.name = name
    obj.data.materials.append(material)
    parts.append(obj)
    return obj


def box(name, center, size, material, parts, bevel=0.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(center))
    obj = bpy.context.object
    obj.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new('Machined edges', 'BEVEL')
    modifier.width = bevel
    modifier.segments = 2
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return finish(obj, name, material, parts)


def rod(name, start, end, radius, material, parts, vertices=16):
    a, b = xyz(start), xyz(end)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius,
                                      depth=(b - a).length, location=(a + b) / 2)
    obj = bpy.context.object
    obj.rotation_quaternion = (b - a).to_track_quat('Z', 'Y')
    obj.rotation_mode = 'QUATERNION'
    return finish(obj, name, material, parts)


def build_support(watcher, source, destination):
    doc, binary = read_glb(source)
    assert not doc.get('extras', {}).get('watcherSupportRevision'), 'Use original GLBs as input'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    materials = {}
    for spec in doc['materials']:
        mat = bpy.data.materials.new(spec['name'])
        mat.diffuse_color = spec['pbrMetallicRoughness'].get('baseColorFactor', [1, 1, 1, 1])
        materials[spec['name']] = mat
    parts = []
    if watcher == 'keeper':
        # Continue the existing ceiling flange; leave all articulated links intact.
        for x in (-0.2, 0.2):
            box('Upright', (x, 10.7, 0), (0.16, 10.4, 0.22), materials['Trim'], parts)
        rod('Piston', (0, 5.5, 0.04), (0, 9.4, 0.04), 0.085, materials['Metal'], parts)
        for y in (5.8, 8.2, 11.3, 14.4):
            box('Rail collar', (0, y, 0), (0.65, 0.2, 0.36), materials['Case'], parts)
            for x in (-0.2, 0.2):
                rod('Collar bolt', (x, y, 0.16), (x, y, 0.22), 0.045, materials['Metal'], parts, 6)
        parent_name = 'Keeper'
        # Ceiling lights use Glow, just like the eyes: remove these nodes only.
        for index in (0, 1, 2, 11):
            doc['nodes'][index].pop('mesh', None)
    else:
        # Rear pad clears the controls and antennas; the boom exits to the right.
        box('Rear mounting pad', (0, 0, -0.86), (0.8, 0.65, 0.2), materials['Dark'], parts)
        rod('Rear swivel', (0, 0, -0.85), (0, 0, -1.3), 0.23, materials['Metal'], parts)
        for y in (-0.16, 0.16):
            box('Side boom', (6, y, -1.25), (12.2, 0.16, 0.25), materials['Dark'], parts)
        for x in (0, 1.65, 4.7, 8, 11.8):
            box('Boom collar', (x, 0, -1.25), (0.22, 0.58, 0.42), materials['Case'], parts)
            rod('Pivot pin', (x, 0, -1.5), (x, 0, -0.99), 0.14, materials['Metal'], parts)
            rod('Pivot bolt', (x, 0, -1), (x, 0, -0.94), 0.07, materials['Dark'], parts, 6)
        parent_name = 'Head'

    # One mesh per existing material, rather than a draw call for every bolt.
    for material in materials.values():
        group = [obj for obj in parts if obj.data.materials[0] == material]
        if not group:
            continue
        parts = [obj for obj in parts if obj not in group]
        bpy.ops.object.select_all(action='DESELECT')
        for obj in group:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = group[0]
        bpy.ops.object.join()
        obj = bpy.context.object
        obj.name = f'{watcher.title()}Support_{material.name}'
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    with tempfile.TemporaryDirectory() as temp:
        geometry_path = Path(temp) / 'support.glb'
        bpy.ops.export_scene.gltf(filepath=str(geometry_path), export_format='GLB',
                                 export_animations=False)
        extra, extra_binary = read_glb(geometry_path)

    # Append geometry while retaining every original node index and animation byte.
    binary = binary[:doc['buffers'][0]['byteLength']]
    binary += b'\0' * (-len(binary) % 4)
    byte_offset = len(binary)
    view_offset = len(doc['bufferViews'])
    accessor_offset = len(doc['accessors'])
    mesh_offset = len(doc['meshes'])
    node_offset = len(doc['nodes'])
    material_indices = {mat['name']: i for i, mat in enumerate(doc['materials'])}
    for view in extra['bufferViews']:
        view['byteOffset'] = view.get('byteOffset', 0) + byte_offset
        doc['bufferViews'].append(view)
    for accessor in extra['accessors']:
        accessor['bufferView'] += view_offset
        doc['accessors'].append(accessor)
    for mesh in extra['meshes']:
        for primitive in mesh['primitives']:
            primitive['attributes'] = {key: value + accessor_offset for key, value in primitive['attributes'].items()}
            primitive['indices'] += accessor_offset
            primitive['material'] = material_indices[extra['materials'][primitive['material']]['name']]
        doc['meshes'].append(mesh)
    for node in extra['nodes']:
        if 'mesh' in node:
            node['mesh'] += mesh_offset
        if 'children' in node:
            node['children'] = [index + node_offset for index in node['children']]
        doc['nodes'].append(node)
    parent = next(node for node in doc['nodes'] if node.get('name') == parent_name)
    parent.setdefault('children', []).extend(index + node_offset for index in extra['scenes'][extra.get('scene', 0)]['nodes'])
    binary += extra_binary
    doc['buffers'][0]['byteLength'] = len(binary)
    doc.setdefault('extras', {})['watcherSupportRevision'] = 1
    write_glb(destination, doc, binary)
    print(f'Updated {destination}: original clips retained, {len(extra["meshes"])} support meshes added')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for watcher in ('keeper', 'overseer'):
        build_support(watcher, args.source_dir / f'{watcher}.glb', args.output_dir / f'{watcher}.glb')
