// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Stable cutscene ids used by saves. */
type StoryCutsceneId = 'intro' | 'finale';

/** One illustrated comic frame with its short caption. */
interface StoryBeat {
  /** Stable id inside the cutscene. */
  id: string;
  /** Child-facing line from `content/story.json`. */
  caption: string;
}

/** One skippable story beat: intro walk/fall, or finale reunion. */
interface StoryCutscene {
  /** Stable id. Save progress keys off this. */
  id: StoryCutsceneId;
  /** Short label for the screen header. */
  title: string;
  /** Ordered pre-rendered comic frames. */
  beats: StoryBeat[];
}

interface StoryFile {
  cutscenes: StoryCutscene[];
}

export type { StoryBeat, StoryCutscene, StoryCutsceneId, StoryFile };
