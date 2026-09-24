import { normalizeName } from '@/shared/utils';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Longest robot name that still fits beside the dog on the scene without
 * shrinking the type below the 16sp floor (3.6).
 *
 * Shorter than the player's: this one is read beside the dog, not in a
 * header with a line to itself.
 */
const ROBOT_NAME_MAX_LENGTH = 10;

/** One letter is a name too — «Б» is a perfectly good robot. */
const ROBOT_NAME_MIN_LENGTH = 1;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Why a name cannot be used yet. `ok` is a state, not an error: the screen
 * shows a reason instead of a silently dead button.
 */
type RobotNameStatus = 'ok' | 'empty';

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * The name as it goes into the save.
 *
 * The rule itself is `normalizeName` in `@/shared/utils`, shared with the
 * player's name — this slice only brings its own limit. It is the second of
 * the two free-text fields in the app and it never leaves the device
 * (docs/privacy.md).
 */
export const normalizeRobotName = (raw: string): string =>
  normalizeName(raw, ROBOT_NAME_MAX_LENGTH);

/** Whether the normalized name may be saved, and why not when it may not. */
export const validateRobotName = (raw: string): RobotNameStatus =>
  normalizeRobotName(raw).length >= ROBOT_NAME_MIN_LENGTH ? 'ok' : 'empty';

/** Shorthand for the screens: the button is live only for a usable name. */
export const isRobotNameValid = (raw: string): boolean =>
  validateRobotName(raw) === 'ok';

export type { RobotNameStatus };
export { ROBOT_NAME_MAX_LENGTH, ROBOT_NAME_MIN_LENGTH };
