// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface LessonQuestion {
  /** One question of the test. */
  question: string;
  /** Answers to choose from, in the order they are shown. */
  options: string[];
  /** Index into `options` of the right one. */
  answerIndex: number;
  /** Worked reasoning shown after either a correct or an incorrect answer. */
  explanation?: string;
}

interface Lesson {
  /**
   * The theme, and with it the bay the lesson sits in: `0` money basics, `1` saving plans,
   * `2` buying decisions.
   */
  sector: number;
  /** The step it sits on, `1` just above the platform … `4` the rim. */
  level: number;
  shortDescription?: string;
  learningObjective?: string;
  scenario?: {
    situation: string;
    actions: { title: string; consequence: string; isRecommended: boolean }[];
  };
  reward?: { coins: number; description: string };

  /** Stable id, used by the save — renaming one loses a child's progress. */
  id: string;
  /** Shown at the top of the lesson and on the cell's card. */
  title: string;
  /** One short paragraph per screenful. The child taps through them. */
  theory: string[];
  /** The test. Answered once each, then a result — not a retry until right. */
  questions: LessonQuestion[];
}

interface LessonFile {
  lessons: Lesson[];
}

export type { Lesson, LessonFile, LessonQuestion };
