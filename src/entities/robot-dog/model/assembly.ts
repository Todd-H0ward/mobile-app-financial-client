import { isRecord } from '@/shared/utils';

interface RobotAssembly {
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
  ['head', 'body', 'legs'].every(
    (key) =>
      Number.isInteger(value[key]) &&
      Number(value[key]) >= 0 &&
      Number(value[key]) < 3,
  );

export type { RobotAssembly };
