import { isRecord } from '@/shared/utils';

interface RobotAssembly {
  /** Free ear silhouette; absent in older saves means floppy ears. */
  ears?: 'floppy' | 'blade' | 'radar';
  /** Free eye shape; absent in older saves means round eyes. */
  face?: 'dots' | 'happy' | 'wide';
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
      ['floppy', 'blade', 'radar'].includes(value.ears))) &&
  (value.face === undefined ||
    (typeof value.face === 'string' &&
      ['dots', 'happy', 'wide'].includes(value.face))) &&
  ['head', 'body', 'legs'].every(
    (key) =>
      Number.isInteger(value[key]) &&
      Number(value[key]) >= 0 &&
      Number(value[key]) < 3,
  );

export type { RobotAssembly };
