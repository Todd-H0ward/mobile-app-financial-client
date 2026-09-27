// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The three stages of the robot's build — the minimum of ТЗ §2.6. */
const ROBOT_DOG_STAGES = ['basic', 'upgraded', 'complete'] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type RobotDogStage = (typeof ROBOT_DOG_STAGES)[number];

export type { RobotDogStage };
export { ROBOT_DOG_STAGES };
