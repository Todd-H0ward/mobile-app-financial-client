import { describe, expect, it } from 'vitest';

import { CONSOLE_FURNITURE_ID, isConsoleOwned } from './ownership';

describe('isConsoleOwned', () => {
  it('is locked until the furniture id is unlocked', () => {
    expect(isConsoleOwned([])).toBe(false);
    expect(isConsoleOwned(['toy-car', 'rooms-living'])).toBe(false);
  });

  it('unlocks when game-console is owned', () => {
    expect(isConsoleOwned([CONSOLE_FURNITURE_ID])).toBe(true);
    expect(isConsoleOwned(['rug', CONSOLE_FURNITURE_ID])).toBe(true);
  });
});
