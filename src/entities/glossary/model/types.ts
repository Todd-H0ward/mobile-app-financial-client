// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One row from `content/glossary.json` — child-facing definition, 2.5.11. */
interface GlossaryTerm {
  /** Stable id. Hints may point here via `termIds` — 3.2. */
  id: string;
  /** Short name in the list. */
  title: string;
  /** Explanation the child reads. Plain language, no jargon. */
  definition: string;
}

interface GlossaryFile {
  terms: GlossaryTerm[];
}

export type { GlossaryFile, GlossaryTerm };
