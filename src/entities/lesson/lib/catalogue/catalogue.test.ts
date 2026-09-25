import { describe, expect, it } from 'vitest';

import { lessonAt, listLessons } from './catalogue';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('lessonAt', () => {
  it('has a distinct exercise for every cell', () => {
    expect(new Set(listLessons().map((lesson) => lesson.id)).size).toBe(90);
  });

  it('gives a different lesson to each cell of a terrace', () => {
    const row = Array.from({ length: 6 }, (_, cell) => lessonAt(cell).id);

    expect(new Set(row).size).toBe(6);
  });

  it('is the same lesson tomorrow — a cell must not wander', () => {
    expect(lessonAt(17)).toBe(lessonAt(17));
  });

  it.each([-1, 90, 900, 0.5, NaN, Infinity])(
    'rejects an invalid cell %s',
    (ordinal) => {
      expect(() => lessonAt(ordinal)).toThrow(RangeError);
    },
  );

  it('answers for every cell of the arena', () => {
    for (let ordinal = 0; ordinal < 90; ordinal += 1) {
      expect(lessonAt(ordinal)).toBeDefined();
    }
  });
});
