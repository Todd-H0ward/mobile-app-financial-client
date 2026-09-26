import { describe, expect, it } from 'vitest';

import { lessonAt, listLessons } from './catalogue';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('lessonAt', () => {
  it('has a distinct exercise for every shipped lesson', () => {
    expect(new Set(listLessons().map((lesson) => lesson.id)).size).toBe(
      listLessons().length,
    );
  });

  it('gives a different lesson to each cell of a terrace', () => {
    const row = Array.from({ length: 6 }, (_, cell) => lessonAt(cell).id);

    expect(new Set(row).size).toBe(6);
  });

  it('is the same lesson tomorrow — a cell must not wander', () => {
    expect(lessonAt(17)).toBe(lessonAt(17));
  });

  it.each([-1, listLessons().length, 900, 0.5, NaN, Infinity])(
    'rejects an invalid index %s',
    (index) => {
      expect(() => lessonAt(index)).toThrow(RangeError);
    },
  );

  it('answers for every cell of the arena', () => {
    for (let ordinal = 0; ordinal < 90; ordinal += 1) {
      expect(lessonAt(ordinal)).toBeDefined();
    }
  });
});
