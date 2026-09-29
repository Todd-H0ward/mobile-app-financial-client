import type { Lesson } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Where the dog's name goes in `lessons.json`. The name is whatever the child typed, so it
 * cannot be declined: the content keeps it in the nominative ("{{name}} копит на цель: …",
 * "{{name}}: в кошельке 20 монет") and never writes "у {{name}}".
 */
const NAME_TOKEN = '{{name}}';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const fill = (text: string, name: string): string =>
  text.split(NAME_TOKEN).join(name);

/** The lesson as the child reads it — with their own dog in every example. */
export const personalizeLesson = (lesson: Lesson, name: string): Lesson => ({
  ...lesson,
  title: fill(lesson.title, name),
  shortDescription:
    lesson.shortDescription === undefined
      ? undefined
      : fill(lesson.shortDescription, name),
  learningObjective:
    lesson.learningObjective === undefined
      ? undefined
      : fill(lesson.learningObjective, name),
  theory: lesson.theory.map((paragraph) => fill(paragraph, name)),
  scenario: lesson.scenario && {
    situation: fill(lesson.scenario.situation, name),
    actions: lesson.scenario.actions.map((action) => ({
      ...action,
      title: fill(action.title, name),
      consequence: fill(action.consequence, name),
    })),
  },
  questions: lesson.questions.map((question) => ({
    ...question,
    question: fill(question.question, name),
    options: question.options.map((option) => fill(option, name)),
    explanation:
      question.explanation === undefined
        ? undefined
        : fill(question.explanation, name),
  })),
});

export { NAME_TOKEN };
