// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The appearance axes, see docs/pet.md.
 *
 * They live here rather than next to the save for the same reason
 * `BUDGET_DIRECTIONS` lives in `entities/economy`: everything that is not the
 * save needs them too — the skin, the pose, the anchors and the species picker
 * in onboarding. `entities/user` imports this leaf and never re-exports it.
 *
 * Runtime tuples, not bare unions: a save is JSON, so `isUserSave` has to check
 * membership rather than trust `typeof value === 'string'`.
 */

/** Species — the axis you read from the silhouette alone. */
const PET_SPECIES = ['cat', 'dog', 'capybara'] as const;

/** Coat — three contrasting colors, never shades of one. */
const PET_COLORS = ['sand', 'graphite', 'mint'] as const;

/** Pattern on top of the coat: the third axis, spare capacity past the nine. */
const PET_PATTERNS = ['solid', 'spots', 'stripes'] as const;

/** Growth stages, docs/pet.md. At least three — requirement 2.5.10. */
const PET_STAGES = ['baby', 'teen', 'adult'] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Pet species — the appearance axis you read from the silhouette alone. */
type PetSpecies = (typeof PET_SPECIES)[number];

/** Coat — three contrasting colors, never shades of one. */
type PetColor = (typeof PET_COLORS)[number];

/** Pattern on top of the coat: the third axis, spare capacity past the nine. */
type PetPattern = (typeof PET_PATTERNS)[number];

/** Growth stage. Never goes backwards — 2.2 forbids wiping progress. */
type PetStage = (typeof PET_STAGES)[number];

export type { PetColor, PetPattern, PetSpecies, PetStage };
export { PET_COLORS, PET_PATTERNS, PET_SPECIES, PET_STAGES };
