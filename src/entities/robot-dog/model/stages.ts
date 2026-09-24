// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The three stages of the robot's build — the minimum of ТЗ §2.6.
 *
 * A robot does not grow up, it gets assembled further, so the names are
 * about the build rather than about age. They are ids, not wording: what the
 * child reads comes from the locale, and the art team is free to rename the
 * stages there without touching a save.
 */
const ROBOT_DOG_STAGES = ['basic', 'upgraded', 'complete'] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type RobotDogStage = (typeof ROBOT_DOG_STAGES)[number];

export type { RobotDogStage };
export { ROBOT_DOG_STAGES };
