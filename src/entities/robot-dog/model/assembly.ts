import { isRecord } from '@/shared/utils';

/** Free ear silhouettes, in the order the picker shows them. */
const ROBOT_EARS = ['floppy', 'blade', 'radar'] as const;

/** Free eye shapes, in the order the picker shows them. */
const ROBOT_FACES = ['dots', 'happy', 'wide'] as const;

type RobotEars = (typeof ROBOT_EARS)[number];
type RobotFace = (typeof ROBOT_FACES)[number];

interface RobotAssembly {
  /** Free ear silhouette; absent in older saves means floppy ears. */
  ears?: RobotEars;
  /** Free eye shape; absent in older saves means round eyes. */
  face?: RobotFace;
  /** Head module: scout ears, radar dish or twin antennae. */
  head: number;
  /** Chassis module: light shell, cargo rack or protective armour. */
  body: number;
  /** Foot module: pads, traction shoes or wide stabilisers. */
  legs: number;
}

export const DEFAULT_ROBOT_ASSEMBLY: RobotAssembly = {
  head: 0,
  body: 0,
  legs: 0,
};

export const isRobotAssembly = (value: unknown): value is RobotAssembly =>
  isRecord(value) &&
  (value.ears === undefined ||
    (typeof value.ears === 'string' &&
      (ROBOT_EARS as readonly string[]).includes(value.ears))) &&
  (value.face === undefined ||
    (typeof value.face === 'string' &&
      (ROBOT_FACES as readonly string[]).includes(value.face))) &&
  ['head', 'body', 'legs'].every(
    (key) =>
      Number.isInteger(value[key]) &&
      Number(value[key]) >= 0 &&
      Number(value[key]) < 3,
  );

export type { RobotAssembly, RobotEars, RobotFace };
export { ROBOT_EARS, ROBOT_FACES };
