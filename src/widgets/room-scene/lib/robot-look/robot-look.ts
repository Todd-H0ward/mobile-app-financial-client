import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import {
  ROBOT_PALETTE,
  type RobotAssembly,
  type RobotDogAction,
  type RobotDogSkin,
} from '@/entities/robot-dog';

/** Local coordinates of the shipped rig; attached to Body so the face follows every clip. */
export const attachRobotLook = (
  root: Object3D,
  assembly: RobotAssembly,
  skin: RobotDogSkin,
) => {
  const body = root.getObjectByName('Body');
  const group = new Group();
  group.name = 'RobotFaceAndEars';
  body?.add(group);
  const hidden: Object3D[] = [];
  root.traverse((node) => {
    if (
      node instanceof Mesh &&
      !Array.isArray(node.material) &&
      node.material.name === 'Glow'
    ) {
      hidden.push(node);
      node.visible = false;
    }
  });
  const dark = new MeshStandardMaterial({
    color: ROBOT_PALETTE.dark,
    roughness: 0.9,
  });
  const accent = new MeshStandardMaterial({
    color: ROBOT_PALETTE.coats[skin][2],
    roughness: 0.8,
  });
  const screen = new MeshBasicMaterial({ color: ROBOT_PALETTE.screen });
  const eye = new MeshBasicMaterial({ color: ROBOT_PALETTE.coats[skin][3] });
  const white = new MeshBasicMaterial({ color: ROBOT_PALETTE.white });
  const materials = [dark, accent, screen, eye, white];
  const frame = new Mesh(
    new RoundedBoxGeometry(0.08, 0.43, 1.03, 2, 0.08),
    dark,
  );
  frame.position.set(-1.88, 0.1, 0);
  group.add(frame);
  const panel = new Mesh(
    new RoundedBoxGeometry(0.025, 0.34, 0.9, 2, 0.065),
    screen,
  );
  panel.position.set(-1.93, 0.1, 0);
  group.add(panel);
  const eyes = new Group();
  eyes.position.set(-1.956, 0.1, 0);
  group.add(eyes);
  for (const z of [-0.24, 0.24]) {
    const pupil = new Mesh(
      assembly.face === 'happy'
        ? new TorusGeometry(0.088, 0.024, 6, 14, Math.PI)
        : new SphereGeometry(0.087, 12, 8),
      eye,
    );
    pupil.position.z = z;
    if (assembly.face === 'happy') pupil.rotation.y = -Math.PI / 2;
    if (assembly.face !== 'happy')
      pupil.scale.set(0.2, assembly.face === 'wide' ? 1.4 : 1, 1);
    eyes.add(pupil);
    if (assembly.face !== 'happy') {
      const glint = new Mesh(new SphereGeometry(0.022, 6, 6), white);
      glint.position.set(-0.019, 0.033, z - 0.022);
      eyes.add(glint);
    }
  }
  for (const name of ['Mast_L', 'Mast_R']) {
    const mast = root.getObjectByName(name);
    if (!mast) continue;
    hidden.push(mast);
    mast.visible = false;
    const ear = new Group();
    ear.position.copy(mast.position);
    group.add(ear);
    const side = mast.position.z > 0 ? 1 : -1;
    if (assembly.ears === 'blade') {
      const piece = new Mesh(new BoxGeometry(0.18, 0.98, 0.12), dark);
      piece.position.y = 0.45;
      piece.rotation.z = -0.3;
      ear.add(piece);
    } else if (assembly.ears === 'radar') {
      const dish = new Mesh(new CylinderGeometry(0.3, 0.18, 0.1, 14), accent);
      dish.rotation.x = Math.PI / 2;
      dish.position.y = 0.2;
      ear.add(dish);
    } else {
      // Same flap as the rendered previews (scripts/art/scene.mjs): broad side-on, hanging down
      // and out from the mast. Hanging straight down it sank into the head and never showed.
      ear.scale.z = side;
      const hinge = new Group();
      hinge.position.y = 0.12;
      hinge.rotation.set(-0.62, 0, -0.3);
      ear.add(hinge);
      const flap = new Mesh(
        new RoundedBoxGeometry(0.2, 1.1, 0.6, 3, 0.09),
        dark,
      );
      flap.position.y = -0.5;
      hinge.add(flap);
      const tip = new Mesh(
        new RoundedBoxGeometry(0.22, 0.22, 0.52, 3, 0.08),
        accent,
      );
      tip.position.y = -1.0;
      hinge.add(tip);
    }
  }
  return {
    setSkin: (next: RobotDogSkin) => {
      accent.color.set(ROBOT_PALETTE.coats[next][2]);
      eye.color.set(ROBOT_PALETTE.coats[next][3]);
    },
    setAction: (action: RobotDogAction) => {
      eyes.scale.y = action === 'sad' ? 0.55 : 1;
      eyes.rotation.x = action === 'joy' ? 0.08 : 0;
    },
    dispose: () => {
      group.removeFromParent();
      group.traverse((n) => {
        if (n instanceof Mesh) n.geometry.dispose();
      });
      materials.forEach((m) => {
        m.dispose();
      });
      hidden.forEach((n) => {
        n.visible = true;
      });
    },
  };
};
