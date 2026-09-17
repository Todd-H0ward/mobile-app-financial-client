// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One row from `content/traits.json`. Titles live here; the save stores ids. */
interface TraitContent {
  /** Stable id. `PetSave.traitIds` addresses this alone. */
  id: string;
  title: string;
  /** Plus and minus in one line — shown when the child picks a trait. */
  blurb: string;
  /**
   * Price multipliers by catalogue `category` (`food`, `toy`, …).
   * Missing category → 1. Must be a positive finite number.
   */
  priceByCategory?: Record<string, number>;
  /**
   * Multipliers for `PERIOD_NEED_DECAY`. Missing axis → 1.
   * Always a tradeoff with price mods — docs/pet.md.
   */
  decay?: {
    comfort?: number;
    spirit?: number;
  };
}

interface TraitsFile {
  traits: TraitContent[];
}

export type { TraitContent, TraitsFile };
