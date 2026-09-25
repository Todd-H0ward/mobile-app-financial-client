import type { LessonStatus } from '@/entities/lesson';
/** Eight line segments per marker keep buffer ranges stable when status changes. */
export const statusMarker = (
  status: LessonStatus,
  x: number,
  y: number,
  z: number,
): number[] => {
  const shapes: Record<LessonStatus, number[][]> = {
    LOCKED: [
      [-5, -1, 5, -1],
      [5, -1, 5, 7],
      [5, 7, -5, 7],
      [-5, 7, -5, -1],
      [-3, -1, -3, -5],
      [-3, -5, 3, -5],
      [3, -5, 3, -1],
      [0, 2, 0, 4],
    ],
    AVAILABLE: [
      [-6, -6, 6, -6],
      [6, -6, 6, 6],
      [6, 6, -6, 6],
      [-6, 6, -6, -6],
    ],
    CURRENT: [
      [-8, 0, 8, 0],
      [8, 0, 1, -7],
      [8, 0, 1, 7],
      [-8, -3, -8, 3],
    ],
    COMPLETED: [
      [-7, 0, -2, 6],
      [-2, 6, 8, -7],
    ],
  };
  const lines = shapes[status];
  return Array.from({ length: 8 }, (_, i) => {
    const [a, b, c, d] = lines[i] ?? [0, 0, 0, 0];
    return [x + a, y, z + b, x + c, y, z + d];
  }).flat();
};
