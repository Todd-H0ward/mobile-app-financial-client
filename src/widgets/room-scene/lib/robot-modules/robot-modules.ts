import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
} from 'three';

import type { RobotAssembly, RobotDogStage } from '@/entities/robot-dog';
import { SCENE_PALETTE } from '@/entities/scene';

/** Model-local sockets follow the animated chassis and ankle joints. */
export const attachRobotModules = (
  root: Object3D,
  assembly: RobotAssembly,
  stage: RobotDogStage,
) => {
  const sockets: Group[] = [];
  const materials = [
    new MeshStandardMaterial({
      color: SCENE_PALETTE.cellFrameMuted,
      roughness: 0.55,
      metalness: 0.25,
    }),
    new MeshStandardMaterial({
      color: SCENE_PALETTE.shared,
      roughness: 0.45,
      metalness: 0.25,
    }),
    new MeshStandardMaterial({
      color: SCENE_PALETTE.segments[1],
      emissive: SCENE_PALETTE.segments[1],
      emissiveIntensity: 0.25,
    }),
  ];
  const socket = (name: string, parent: string, x = 0, y = 0, z = 0) => {
    const group = new Group();
    group.name = name;
    group.position.set(x, y, z);
    (root.getObjectByName(parent) ?? root).add(group);
    sockets.push(group);
    return group;
  };
  const part = (
    parent: Group,
    geometry: BoxGeometry | CylinderGeometry | SphereGeometry,
    x: number,
    y: number,
    z: number,
    material = 0,
  ) => {
    const mesh = new Mesh(geometry, materials[material]);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const head = socket('Socket_HeadModule', 'Body', -1.1, 0.55);
  if (assembly.head === 0) {
    for (const z of [-0.5, 0.5])
      part(head, new BoxGeometry(0.22, 0.48, 0.14), 0, 0.2, z, 1);
  } else if (assembly.head === 1) {
    part(head, new CylinderGeometry(0.08, 0.08, 0.3, 6), 0, 0.15, 0, 1);
    const dish = part(
      head,
      new CylinderGeometry(0.42, 0.14, 0.12, 12),
      0,
      0.38,
      0,
    );
    dish.rotation.z = 0.55;
  } else {
    for (const z of [-0.4, 0.4]) {
      part(head, new CylinderGeometry(0.045, 0.07, 0.65, 6), 0, 0.3, z, 1);
      part(head, new SphereGeometry(0.12, 8, 6), 0, 0.65, z, 2);
    }
  }
  const body = socket('Socket_BodyModule', 'Body', 0.35, 0.6);
  if (assembly.body === 0) {
    part(body, new BoxGeometry(1.2, 0.12, 0.85), 0, 0, 0);
  } else if (assembly.body === 1) {
    part(body, new BoxGeometry(1.35, 0.4, 0.9), 0, 0.16, 0, 1);
    for (const z of [-0.48, 0.48])
      part(body, new BoxGeometry(1.5, 0.13, 0.1), 0, 0.42, z);
  } else {
    part(body, new BoxGeometry(1.6, 0.22, 1.15), 0, 0.08, 0, 1);
    for (const z of [-0.58, 0.58])
      part(body, new BoxGeometry(1.6, 0.55, 0.12), 0, -0.15, z);
  }
  for (const joint of ['FL_Ankle', 'FR_Ankle', 'RL_Ankle', 'RR_Ankle']) {
    const foot = socket(`Socket_LegsModule_${joint}`, joint);
    const width = [0.3, 0.42, 0.65][assembly.legs];
    part(foot, new BoxGeometry(0.55, 0.13, width), -0.12, 0.04, 0, 1);
    if (assembly.legs === 1) {
      for (const x of [-0.28, 0.05])
        part(foot, new BoxGeometry(0.09, 0.1, width), x, -0.01, 0);
    }
  }
  // Growth changes equipment, never the selected starting configuration.
  if (stage !== 'basic') {
    const pack = socket('Socket_GrowthBattery', 'Body', 0.85, 0.2, 0.72);
    part(pack, new CylinderGeometry(0.2, 0.2, 0.65, 8), 0, 0, 0, 2);
  }
  if (stage === 'complete') {
    const beacon = socket('Socket_GrowthBeacon', 'Body', 1.1, 0.75);
    part(beacon, new CylinderGeometry(0.08, 0.08, 0.65, 6), 0, 0.3, 0, 1);
    part(beacon, new SphereGeometry(0.2, 10, 8), 0, 0.68, 0, 2);
  }
  let isDisposed = false;
  return {
    dispose: () => {
      if (isDisposed) return;
      isDisposed = true;
      for (const group of sockets) {
        group.removeFromParent();
        group.traverse((object) => {
          if (object instanceof Mesh) object.geometry.dispose();
        });
      }
      for (const material of materials) material.dispose();
    },
  };
};
