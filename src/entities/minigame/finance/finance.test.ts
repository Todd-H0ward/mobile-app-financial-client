import { describe, expect, it } from 'vitest';

import { isSpriteName } from '@/entities/sprite';

import { financeRound, financeWeek } from './finance';

describe('calendar-fixed finance games', () => {
  it('keeps each round fixed within the day and weekly rounds within the week', () => {
    const monday = Date.UTC(2026, 8, 21);
    expect(financeRound('market', monday, 0)).toEqual(
      financeRound('market', monday + 50000, 0),
    );
    expect(financeRound('weekly', monday, 1)).toEqual(
      financeRound('weekly', monday + 6 * 86400000, 1),
    );
    expect(financeWeek(monday + 7 * 86400000)).toBe(financeWeek(monday) + 1);
  });
  it('draws every round, and «n details» as n gears', () => {
    for (const game of ['market', 'weekly'] as const) {
      for (let index = 0; index < 3; index += 1) {
        const round = financeRound(game, 86_400_000 * 30, index);
        expect(round.art.length).toBeGreaterThan(0);
        for (const group of round.art) {
          expect(isSpriteName(group.sprite)).toBe(true);
          expect(group.count).toBeGreaterThanOrEqual(1);
        }
      }
    }
    const market = financeRound('market', 86_400_000 * 30, 0);
    const details = Number(/стоят (\d+) детал/.exec(market.question)?.[1]);
    expect(market.art).toEqual([{ sprite: 'gear', count: details }]);
  });

  it('offers distinct answers and an explanation in all three rounds', () => {
    for (const game of ['market', 'weekly'] as const)
      for (let day = 0; day < 40; day++)
        for (let index = 0; index < 3; index++) {
          const round = financeRound(game, day * 86400000, index);
          expect(new Set(round.options).size).toBe(3);
          expect(round.options[round.correct]).toBeDefined();
          expect(round.explanation.length).toBeGreaterThan(20);
        }
  });
});
