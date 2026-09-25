import { Group, Mesh, MeshStandardMaterial } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { attachRobotModules } from './robot-modules';

import { readFileSync } from 'node:fs';

const rig = () => {
  const root = new Group();
  for (const name of ['Body', 'FL_Ankle', 'FR_Ankle', 'RL_Ankle', 'RR_Ankle']) {
    const joint = new Group();
    joint.name = name;
    root.add(joint);
  }
  return root;
};

describe('robot assembly', () => {
  it('uses joint names present in the actual bundled robot GLB', () => {
    const bytes = readFileSync('assets/robot-dog/robot-dog.glb');
    const jsonLength = bytes.readUInt32LE(12);
    const model = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
    const names = new Set(
      model.nodes.map((node: { name?: string }) => node.name),
    );
    for (const name of [
      'Body',
      'FL_Ankle',
      'FR_Ankle',
      'RL_Ankle',
      'RR_Ankle',
    ]) {
      expect(names.has(name)).toBe(true);
    }
  });
  it('builds 27 geometrically distinct assemblies on animated sockets', () => {
    const shapes = new Set<string>();
    for (let head = 0; head < 3; head += 1) {
      for (let body = 0; body < 3; body += 1) {
        for (let legs = 0; legs < 3; legs += 1) {
          const root = rig();
          const modules = attachRobotModules(
            root,
            { head, body, legs },
            'basic',
          );
          expect(root.getObjectByName('Socket_HeadModule')?.parent?.name).toBe(
            'Body',
          );
          expect(
            root.getObjectByName('Socket_LegsModule_FL_Ankle')?.parent?.name,
          ).toBe('FL_Ankle');
          const signature: unknown[] = [];
          root.traverse((node) => {
            if (node instanceof Mesh)
              signature.push([
                node.geometry.type,
                node.geometry.toJSON(),
                node.position.toArray(),
              ]);
          });
          shapes.add(
            JSON.stringify(signature, (key, value) =>
              key === 'uuid' ? undefined : value,
            ),
          );
          modules.dispose();
          expect(root.getObjectByName('Socket_HeadModule')).toBeUndefined();
        }
      }
    }
    expect(shapes.size).toBe(27);
  });
  it('adds earned equipment at each of three growth stages', () => {
    for (const stage of ['basic', 'upgraded', 'complete'] as const) {
      const root = rig();
      const modules = attachRobotModules(
        root,
        { head: 0, body: 0, legs: 0 },
        stage,
      );
      expect(Boolean(root.getObjectByName('Socket_GrowthBattery'))).toBe(
        stage !== 'basic',
      );
      expect(Boolean(root.getObjectByName('Socket_GrowthBeacon'))).toBe(
        stage === 'complete',
      );
      modules.dispose();
    }
  });
  it('releases its materials exactly once without disposing the original rig', () => {
    const root = rig();
    const release = vi.spyOn(MeshStandardMaterial.prototype, 'dispose');
    const modules = attachRobotModules(
      root,
      { head: 2, body: 2, legs: 2 },
      'complete',
    );
    modules.dispose();
    modules.dispose();
    expect(release).toHaveBeenCalledTimes(3);
    expect(root.children).toHaveLength(5);
    release.mockRestore();
  });
});
