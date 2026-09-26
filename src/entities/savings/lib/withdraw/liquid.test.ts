import { describe, expect, it } from 'vitest';

import { PLATFORM_GOAL_ID } from '@/entities/economy';

import { isLiquid } from './liquid';

describe('isLiquid', () => {
  it('treats the platform lift jar as non-liquid', () => {
    expect(isLiquid(PLATFORM_GOAL_ID)).toBe(false);
  });

  it('treats every other goal as liquid', () => {
    expect(isLiquid('scooter')).toBe(true);
    expect(isLiquid('paints')).toBe(true);
  });
});
