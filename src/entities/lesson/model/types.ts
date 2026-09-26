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
  /** Arena coordinates and learning metadata; old fixtures may omit these. */
  sector?: number;
  level?: number;
  index?: number;
  shortDescription?: string;
  learningObjective?: string;
  scenario?: {
    situation: string;
    actions: { title: string; consequence: string; isRecommended: boolean }[];
  };
  reward?: { coins: number; description: string };
  unlockCondition?: { platformLevel: number; completedCells: string[] };

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
