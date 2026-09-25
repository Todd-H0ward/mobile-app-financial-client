import { lessonAt } from '../catalogue';

type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'CURRENT' | 'COMPLETED';
export const lessonCellKey = (ordinal: number): string =>
  `${Math.floor(ordinal / 30)}-${Math.floor((ordinal % 30) / 6)}-${ordinal % 6}`;
export const lessonOrdinalForKey = (key: string): number | null => {
  if (!/^[0-2]-[0-4]-[0-5]$/.test(key)) return null;
  const [sector, level, index] = key.split('-').map(Number);
  return sector * 30 + level * 6 + index;
};
export const lessonAccess = (
  ordinal: number,
  completed: readonly string[],
  platformLevel: number,
): { status: LessonStatus; requiredLevel: number; missing: number } => {
  const lesson = lessonAt(ordinal);
  const requiredLevel =
    lesson.unlockCondition?.platformLevel ?? Math.floor((ordinal % 30) / 6);
  if (completed.includes(lessonCellKey(ordinal)))
    return { status: 'COMPLETED', requiredLevel, missing: 0 };
  const preceding = lesson.unlockCondition?.completedCells ?? [];
  const missing = preceding.filter((key) => !completed.includes(key)).length;
  if (platformLevel < requiredLevel || missing > 0)
    return { status: 'LOCKED', requiredLevel, missing };
  const start = Math.floor(ordinal / 6) * 6;
  const first = Array.from({ length: 6 }, (_, i) => start + i).find(
    (n) => !completed.includes(lessonCellKey(n)),
  );
  return {
    status: ordinal === first ? 'CURRENT' : 'AVAILABLE',
    requiredLevel,
    missing: 0,
  };
};
export type { LessonStatus };
