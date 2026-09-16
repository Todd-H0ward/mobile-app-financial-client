import type { PetColor } from './appearance';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One coat, as the four fills a body is drawn from. */
interface PetCoatPalette {
  /** Main fill of the body. The color the child names when asked. */
  coat: string;
  /** Shaded side and underside of the same coat. Darker than `coat`. */
  shade: string;
  /** Belly, muzzle and paw tips. Lighter than `coat`. */
  belly: string;
  /** Spots and stripes drawn on top. Must read against `coat` at icon size. */
  ink: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Coat palettes. Domain data, not theme tokens.
 *
 * AGENTS.md bans color literals outside `shared/constants/theme.ts`, and rule 7
 * bans domain data inside `shared/`. A coat belongs to the child's pet, not to
 * the design system, and it does not change with the color scheme — so it stays
 * here, and this file is the single place in the app where a pet hex is
 * written. Renderers never type a color: they read `skinFor`. `skin.test.ts`
 * fails the day one leaks into `skin.ts`.
 *
 * The three are contrasting hues, not shades of one — 2.5.2 is judged on two
 * screenshots side by side.
 */
const PET_PALETTE: Record<PetColor, PetCoatPalette> = {
  sand: {
    belly: '#F6E3C4',
    coat: '#E8C48A',
    ink: '#A9763A',
    shade: '#CFA666',
  },
  graphite: {
    belly: '#9A938B',
    coat: '#5A5550',
    ink: '#2A2724',
    shade: '#403C38',
  },
  mint: {
    belly: '#DDF2E9',
    coat: '#8FD1B8',
    ink: '#3F8C72',
    shade: '#6AB299',
  },
};

/**
 * Line art, shared by every coat.
 *
 * Deliberately the same value as the theme's light `text`, copied rather than
 * imported: the pet must not invert at night — it stays the same animal in both
 * schemes, and 2.5.2 is judged on screenshots.
 */
const PET_INK = {
  /** Outline of the whole silhouette. */
  outline: '#3F332C',
  /** Pupils. Never lighter than the coat, or the face disappears. */
  eye: '#2A231E',
  /** Cheeks and inner ear. The one warm accent on every pet. */
  blush: '#E79A8C',
} as const;

export type { PetCoatPalette };
export { PET_INK, PET_PALETTE };
