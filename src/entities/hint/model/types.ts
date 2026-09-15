// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Screens that must have a hint of their own — requirement 2.5.1, "help is
 * available at any moment".
 *
 * A runtime tuple, because the schema checks it: the day a screen is added to
 * the app and forgotten here, the content test fails instead of a child
 * finding a "?" that opens nothing.
 */
const HINT_SCREENS = ['onboarding', 'home', 'ui-kit'] as const;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Screen a hint belongs to. */
type HintScreenId = (typeof HINT_SCREENS)[number];

/** One screen's hint. Words only — the widget owns the layout, 3.2. */
interface HintContent {
  /** Screen this hint opens on. */
  id: HintScreenId;
  /** Heading of the sheet. */
  title: string;
  /** Paragraphs, in reading order. First one answers "what do I do here". */
  body: string[];
  /**
   * Glossary terms this hint leans on (2.5.11). Unused until the glossary
   * lands; it is here so the hint and the glossary are written against the
   * same ids instead of drifting into two sets of wording.
   */
  termIds?: string[];
}

/** The whole of `content/hints.json`. */
interface HintsFile {
  /** One row per screen from `HINT_SCREENS`. */
  hints: HintContent[];
}

export type { HintContent, HintScreenId, HintsFile };
export { HINT_SCREENS };
