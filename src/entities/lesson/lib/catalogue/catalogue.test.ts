import { describe, expect, it } from 'vitest';

import { lessonAt, listLessons } from './catalogue';

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

describe('lessonAt', () => {
  const count = listLessons().length;

  it('gives a different lesson to each cell of a terrace', () => {
    const row = Array.from({ length: 6 }, (_, cell) => lessonAt(cell).id);

    expect(new Set(row).size).toBe(6);
  });

  it('is the same lesson tomorrow — a cell must not wander', () => {
    expect(lessonAt(17)).toBe(lessonAt(17));
  });

  it('wraps rather than running out', () => {
    expect(lessonAt(count)).toBe(lessonAt(0));
    expect(lessonAt(count * 7 + 3)).toBe(lessonAt(3));
  });

  it('answers for every cell of the arena', () => {
    for (let ordinal = 0; ordinal < 90; ordinal += 1) {
      expect(lessonAt(ordinal)).toBeDefined();
    }
  });
});
