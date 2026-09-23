// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The coats the robot dog ships with, in the order the picker shows them.
 *
 * Every skin is the same mesh and the same four clips — only the textures
 * differ. That is why the picker can swap one for another without the game
 * knowing anything about geometry.
 */
const ROBOT_DOG_SKINS = [
  'factory',
  'arctic',
  'carbon',
  'desert',
  'forest',
  'rescue',
  'rust',
] as const;

/** The coat a fresh profile starts with — the plainest of the seven. */
const DEFAULT_ROBOT_DOG_SKIN = 'factory';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type RobotDogSkin = (typeof ROBOT_DOG_SKINS)[number];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Narrows anything read back from a save to a coat the app still ships. */
const isRobotDogSkin = (value: unknown): value is RobotDogSkin =>
  ROBOT_DOG_SKINS.includes(value as RobotDogSkin);

export type { RobotDogSkin };
export { DEFAULT_ROBOT_DOG_SKIN, isRobotDogSkin, ROBOT_DOG_SKINS };
