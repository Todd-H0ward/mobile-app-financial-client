import { normalizeName } from '@/shared/utils';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Longest game name that still fits the header of the home screen and the sign over the
 * door without shrinking the type below the 16sp floor (3.6).
 */
const PLAYER_NAME_MAX_LENGTH = 12;

/** One letter is a name too — some children pick an initial. */
const PLAYER_NAME_MIN_LENGTH = 1;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Why a name cannot be used yet. */
type PlayerNameStatus = 'ok' | 'empty';

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export const normalizePlayerName = (raw: string): string =>
  normalizeName(raw, PLAYER_NAME_MAX_LENGTH);

export const validatePlayerName = (raw: string): PlayerNameStatus =>
  normalizePlayerName(raw).length >= PLAYER_NAME_MIN_LENGTH ? 'ok' : 'empty';

/** Shorthand for the screens: the button is live only for a usable name. */
export const isPlayerNameValid = (raw: string): boolean =>
  validatePlayerName(raw) === 'ok';

export type { PlayerNameStatus };
export { PLAYER_NAME_MAX_LENGTH, PLAYER_NAME_MIN_LENGTH };
