import { describe, expect, it } from 'vitest';

import {
  ARCADE_SCORE_LIMIT,
  formatArcadeTime,
  recordSnakeScore,
  recordSpacewarTime,
} from './scores';

describe('recordSnakeScore', () => {
  it('keeps the highest apples first and caps the list', () => {
    let scores: number[] = [];
    scores = recordSnakeScore(scores, 3);
    scores = recordSnakeScore(scores, 8);
    scores = recordSnakeScore(scores, 5);
    expect(scores).toEqual([8, 5, 3]);

    for (let i = 0; i < ARCADE_SCORE_LIMIT + 2; i += 1) {
      scores = recordSnakeScore(scores, i + 1);
    }
    expect(scores).toHaveLength(ARCADE_SCORE_LIMIT);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1] ?? 0);
  });

  it('ignores non-positive scores', () => {
    expect(recordSnakeScore([4], 0)).toEqual([4]);
    expect(recordSnakeScore([4], -2)).toEqual([4]);
  });
});

describe('recordSpacewarTime', () => {
  it('keeps the fastest clears first', () => {
    let times: number[] = [];
    times = recordSpacewarTime(times, 12_000);
    times = recordSpacewarTime(times, 8_000);
    times = recordSpacewarTime(times, 15_000);
    expect(times).toEqual([8_000, 12_000, 15_000]);
  });
});

describe('formatArcadeTime', () => {
  it('formats short and long clears', () => {
    expect(formatArcadeTime(4_200)).toBe('4s');
    expect(formatArcadeTime(65_000)).toBe('1:05');
  });
});
