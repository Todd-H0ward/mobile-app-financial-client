import type { RobotDogSkin } from '@/entities/robot-dog';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** The three material groups the artist painted separately. */
type RobotDogTextureSlot = 'body' | 'dark' | 'mid';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Geometry and the four clips, once — every coat shares them. */
const ROBOT_DOG_MODEL =
  require('../../../../assets/robot-dog/robot-dog.glb') as number;

/** Albedo per coat, one file per material group. The textures live outside the GLB on purpose. */
const ROBOT_DOG_TEXTURES: Record<
  RobotDogSkin,
  Record<RobotDogTextureSlot, number>
> = {
  factory: {
    body: require('../../../../assets/robot-dog/skins/factory/body.png') as number,
    dark: require('../../../../assets/robot-dog/skins/factory/dark.png') as number,
    mid: require('../../../../assets/robot-dog/skins/factory/mid.png') as number,
  },
  arctic: {
    body: require('../../../../assets/robot-dog/skins/arctic/body.png') as number,
    dark: require('../../../../assets/robot-dog/skins/arctic/dark.png') as number,
    mid: require('../../../../assets/robot-dog/skins/arctic/mid.png') as number,
  },
  carbon: {
    body: require('../../../../assets/robot-dog/skins/carbon/body.png') as number,
    dark: require('../../../../assets/robot-dog/skins/carbon/dark.png') as number,
    mid: require('../../../../assets/robot-dog/skins/carbon/mid.png') as number,
  },
  desert: {
    body: require('../../../../assets/robot-dog/skins/desert/body.png') as number,
    dark: require('../../../../assets/robot-dog/skins/desert/dark.png') as number,
    mid: require('../../../../assets/robot-dog/skins/desert/mid.png') as number,
  },
  forest: {
    body: require('../../../../assets/robot-dog/skins/forest/body.png') as number,
    dark: require('../../../../assets/robot-dog/skins/forest/dark.png') as number,
    mid: require('../../../../assets/robot-dog/skins/forest/mid.png') as number,
  },
  rescue: {
    body: require('../../../../assets/robot-dog/skins/rescue/body.png') as number,
    dark: require('../../../../assets/robot-dog/skins/rescue/dark.png') as number,
    mid: require('../../../../assets/robot-dog/skins/rescue/mid.png') as number,
  },
  rust: {
    body: require('../../../../assets/robot-dog/skins/rust/body.png') as number,
    dark: require('../../../../assets/robot-dog/skins/rust/dark.png') as number,
    mid: require('../../../../assets/robot-dog/skins/rust/mid.png') as number,
  },
};

/** Which albedo each material in the GLB wears. */
const ROBOT_DOG_MATERIAL_SLOTS: Record<string, RobotDogTextureSlot> = {
  Body: 'body',
  Dark: 'dark',
  Metal: 'mid',
};

export type { RobotDogTextureSlot };
export { ROBOT_DOG_MATERIAL_SLOTS, ROBOT_DOG_MODEL, ROBOT_DOG_TEXTURES };
