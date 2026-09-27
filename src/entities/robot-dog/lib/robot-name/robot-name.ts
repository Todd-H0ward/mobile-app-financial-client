import { normalizeName } from '@/shared/utils';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Longest robot name that still fits beside the dog on the scene without shrinking the
 * type below the 16sp floor (3.6).
 */
const ROBOT_NAME_MAX_LENGTH = 10;

/** One letter is a name too — «Б» is a perfectly good robot. */
const ROBOT_NAME_MIN_LENGTH = 1;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Why a name cannot be used yet. `ok` is a state, not an error: the screen shows a reason
 * instead of a silently dead button.
 */
type RobotNameStatus = 'ok' | 'empty';

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export const normalizeRobotName = (raw: string): string =>
  normalizeName(raw, ROBOT_NAME_MAX_LENGTH);

export const validateRobotName = (raw: string): RobotNameStatus =>
  normalizeRobotName(raw).length >= ROBOT_NAME_MIN_LENGTH ? 'ok' : 'empty';

/** Shorthand for the screens: the button is live only for a usable name. */
export const isRobotNameValid = (raw: string): boolean =>
  validateRobotName(raw) === 'ok';

export type { RobotNameStatus };
export { ROBOT_NAME_MAX_LENGTH, ROBOT_NAME_MIN_LENGTH };
