import type {
  EmotionKey,
  PetColor,
  PetMood,
  PetMoodName,
  PetPattern,
  PetReason,
  PetSpecies,
} from '../../model';
import {
  FUR_PALETTE,
  type PetAppearance,
  type PetCoatPattern,
} from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The save's three coats, as entries of the renderer's fur palette.
 *
 * The save stores an axis, not a colour — three contrasting choices a child
 * can name (2.5.2) — while the renderer wants the four tones it paints with.
 * This table is the seam, and it is the only place the two vocabularies meet.
 */
const COAT: Record<PetColor, (typeof FUR_PALETTE)[number]['id']> = {
  sand: 'sand',
  graphite: 'cocoa',
  mint: 'mint',
};

/** The save's three patterns, as markings the renderer knows how to draw. */
const PATTERN: Record<PetPattern, PetCoatPattern> = {
  solid: 'plain',
  spots: 'patch',
  stripes: 'tabby',
};

/** Ears and tails follow the species; they are not an axis of their own yet. */
const BUILD: Record<
  PetSpecies,
  Pick<PetAppearance, 'ears' | 'eyes' | 'tail'>
> = {
  cat: { ears: 'pointy', eyes: 'round', tail: 'long' },
  dog: { ears: 'folded', eyes: 'round', tail: 'short' },
  capybara: { ears: 'round', eyes: 'sleepy', tail: 'short' },
};

/** The accent the overlays are drawn with. The app's own accent, warm. */
const ACCENT = '#E58A2B';

/**
 * The face a named cause calls for.
 *
 * The cause is checked before the mood because it is the more specific of the
 * two: «uncomfortable» draws a shiver or a growling stomach depending on which
 * need fell, and 2.5.10 asks for the cause to be legible, not just the state.
 */
const FACE_BY_REASON: Partial<Record<PetReason, EmotionKey>> = {
  hungry: 'hungry',
  cold: 'cold',
  'nothing-to-do': 'lonely',
  'goal-far': 'sad',
  'plan-broken': 'sad',
  'goal-near': 'excited',
  'tasks-done': 'happy',
  'plan-kept': 'proud',
  fed: 'calm',
  warm: 'calm',
};

/** The face a state calls for when the cause does not name a better one. */
const FACE_BY_MOOD: Record<PetMoodName, EmotionKey> = {
  proud: 'proud',
  content: 'calm',
  bored: 'lonely',
  uncomfortable: 'hungry',
  sad: 'sad',
};

// ═══════════════════════════════════════════
// PRESENTATION
// ═══════════════════════════════════════════

/**
 * The save's appearance axes, as something the renderer can draw.
 *
 * Pure and total: every one of the twenty-seven combinations resolves, with no
 * fallback branch. Keeping the seam here is what lets the renderer carry free
 * colours while the save keeps storing three named coats that survive a
 * migration.
 */
export const appearanceFor = (
  species: PetSpecies,
  color: PetColor,
  pattern: PetPattern,
): PetAppearance => {
  const coat =
    FUR_PALETTE.find((entry) => entry.id === COAT[color]) ?? FUR_PALETTE[0];

  return {
    species,
    fur: coat.fur,
    belly: coat.belly,
    cheeks: coat.cheeks,
    pattern: PATTERN[pattern],
    accent: ACCENT,
    ...BUILD[species],
  };
};

/**
 * The face a mood wears.
 *
 * The named cause wins where it has a face of its own, so «голодно» and
 * «холодно» do not read as the same animal — the two are one mood on the axes
 * and two different pets on screen.
 */
export const emotionFor = (mood: PetMood): EmotionKey =>
  FACE_BY_REASON[mood.reason] ?? FACE_BY_MOOD[mood.name];
