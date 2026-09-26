// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Stable cutscene ids — also the keys under `assets/story/`. */
type StoryCutsceneId = 'intro' | 'finale';

/** One caption card shown while the video is missing (or under it later). */
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
  /**
   * Filename under `assets/story/` once the mp4 ships.
   * The screen ignores it until `assetModule` is wired.
   */
  asset: string;
  /** Ordered caption beats for the placeholder (and later as subtitles). */
  beats: StoryBeat[];
}

interface StoryFile {
  cutscenes: StoryCutscene[];
}

export type { StoryBeat, StoryCutscene, StoryCutsceneId, StoryFile };
