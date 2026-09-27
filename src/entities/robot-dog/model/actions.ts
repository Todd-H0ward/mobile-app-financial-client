// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** What the robot dog can be doing, in the order the picker shows them. */
const ROBOT_DOG_ACTIONS = ['idle', 'walk', 'joy', 'sad'] as const;

/** Clip names inside the GLB, exactly as exported. */
const ROBOT_DOG_CLIPS = {
  idle: 'Idle_Pokoy',
  walk: 'Walk_Hodba',
  joy: 'Joy_Radost',
  sad: 'Sad_Grust',
} as const;

/** What plays when nothing else asks for anything. */
const DEFAULT_ROBOT_DOG_ACTION = 'idle';

/** Seconds a tap's reaction holds before the dog settles back. */
const ROBOT_DOG_REACTION_SEC = 2.4;

/** Seconds one clip takes to blend into the next. Never a hard cut. */
const ROBOT_DOG_FADE_SEC = 0.35;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type RobotDogAction = (typeof ROBOT_DOG_ACTIONS)[number];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** Narrows anything read back from a save to a clip the model still has. */
const isRobotDogAction = (value: unknown): value is RobotDogAction =>
  ROBOT_DOG_ACTIONS.includes(value as RobotDogAction);

export type { RobotDogAction };
export {
  DEFAULT_ROBOT_DOG_ACTION,
  isRobotDogAction,
  ROBOT_DOG_ACTIONS,
  ROBOT_DOG_CLIPS,
  ROBOT_DOG_FADE_SEC,
  ROBOT_DOG_REACTION_SEC,
};
