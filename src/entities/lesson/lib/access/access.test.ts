import { describe, expect, it } from 'vitest';

import { listLessons } from '../catalogue';

import { lessonAccess, lessonCellKey, lessonOrdinalForKey } from './access';

describe('arena lesson access', () => {
  it('opens six first-row lessons in each of the three sectors', () => {
    for (const sector of [0, 1, 2]) {
      expect(lessonAccess(sector * 30, [], 0).status).toBe('CURRENT');
      expect(lessonAccess(sector * 30 + 5, [], 0).status).toBe('AVAILABLE');
      expect(lessonAccess(sector * 30 + 6, [], 0).status).toBe('LOCKED');
    }
  });
  it('requires both the complete preceding row and the paid lift', () => {
    const row = Array.from({ length: 6 }, (_, i) => lessonCellKey(i));
    expect(lessonAccess(6, row, 0).status).toBe('LOCKED');
    expect(lessonAccess(6, row.slice(1), 1).status).toBe('LOCKED');
    expect(lessonAccess(6, row, 1).status).toBe('CURRENT');
    expect(lessonAccess(36, row, 1).status).toBe('LOCKED');
  });
  it('keeps earned progress accessible and advances the suggested cell', () => {
    expect(lessonAccess(0, ['0-0-0'], 0).status).toBe('COMPLETED');
    expect(lessonAccess(1, ['0-0-0'], 0).status).toBe('CURRENT');
    expect(lessonAccess(89, ['2-4-5'], 0).status).toBe('COMPLETED');
  });
  it('maps all ninety cells and rejects malformed keys', () => {
    for (let n = 0; n < 90; n++)
      expect(lessonOrdinalForKey(lessonCellKey(n))).toBe(n);
    for (const key of ['3-0-0', '0-5-0', '0-0-6', 'NaN', ''])
      expect(lessonOrdinalForKey(key)).toBeNull();
  });
  it('ships a complete decision scenario, metadata and unlock rule for every lesson', () => {
    for (const [n, lesson] of listLessons().entries()) {
      expect(lesson.sector).toBe(Math.floor(n / 30));
      expect(lesson.level).toBe(Math.floor((n % 30) / 6));
      expect(lesson.learningObjective?.length).toBeGreaterThan(0);
      expect(lesson.scenario?.actions.length).toBeGreaterThanOrEqual(2);
      expect(
        lesson.scenario?.actions.every(
          (action) => action.title && action.consequence,
        ),
      ).toBe(true);
      expect(
        lesson.scenario?.actions.some((action) => action.isRecommended),
      ).toBe(true);
      expect(lesson.unlockCondition?.platformLevel).toBe(lesson.level);
      expect(lesson.reward?.coins).toBe(0);
    }
  });
});
