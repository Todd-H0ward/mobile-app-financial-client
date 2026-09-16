import { normalizeName } from '@/shared/utils';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Longest pet name that still fits under the pet on the room screen without
 * shrinking the type below the 16sp floor (3.6).
 *
 * Shorter than the player's: this one is read beside the animal, not in a
 * header with a line to itself.
 */
const PET_NAME_MAX_LENGTH = 10;

/** One letter is a name too — «Б» is a perfectly good cat. */
const PET_NAME_MIN_LENGTH = 1;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * Why a name cannot be used yet. `ok` is a state, not an error: the screen
 * shows a reason instead of a silently dead button.
 */
type PetNameStatus = 'ok' | 'empty';

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
export const normalizePetName = (raw: string): string =>
  normalizeName(raw, PET_NAME_MAX_LENGTH);

/** Whether the normalized name may be saved, and why not when it may not. */
export const validatePetName = (raw: string): PetNameStatus =>
  normalizePetName(raw).length >= PET_NAME_MIN_LENGTH ? 'ok' : 'empty';

/** Shorthand for the screens: the button is live only for a usable name. */
export const isPetNameValid = (raw: string): boolean =>
  validatePetName(raw) === 'ok';

export type { PetNameStatus };
export { PET_NAME_MAX_LENGTH, PET_NAME_MIN_LENGTH };
