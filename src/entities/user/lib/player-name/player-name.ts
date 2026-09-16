import { normalizeName } from '@/shared/utils';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Longest game name that still fits the header of the home screen and the
 * sign over the door without shrinking the type below the 16sp floor (3.6).
 */
const PLAYER_NAME_MAX_LENGTH = 12;

/** One letter is a name too — some children pick an initial. */
const PLAYER_NAME_MIN_LENGTH = 1;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Why a name cannot be used yet. `ok` is a state, not an error: the screen
 * shows a reason instead of a silently dead button — a child who typed only
 * spaces has to learn what the app is waiting for.
 */
type PlayerNameStatus = 'ok' | 'empty';

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * The name as it goes into the save: outer spaces gone, inner runs collapsed,
 * length capped.
 *
 * It is a game name and the only text the child invents about themselves — it
 * is never called a real name and never leaves the device (docs/privacy.md).
 */
export const normalizePlayerName = (raw: string): string =>
  normalizeName(raw, PLAYER_NAME_MAX_LENGTH);

/** Whether the normalized name may be saved, and why not when it may not. */
export const validatePlayerName = (raw: string): PlayerNameStatus =>
  normalizePlayerName(raw).length >= PLAYER_NAME_MIN_LENGTH ? 'ok' : 'empty';

/** Shorthand for the screens: the button is live only for a usable name. */
export const isPlayerNameValid = (raw: string): boolean =>
  validatePlayerName(raw) === 'ok';

export type { PlayerNameStatus };
export { PLAYER_NAME_MAX_LENGTH, PLAYER_NAME_MIN_LENGTH };
