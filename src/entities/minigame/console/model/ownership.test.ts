import { describe, expect, it } from 'vitest';

import { CONSOLE_OWNED_ID, isConsoleOwned } from './ownership';

describe('isConsoleOwned', () => {
  it('is locked until the owned id is bought', () => {
    expect(isConsoleOwned([])).toBe(false);
    expect(isConsoleOwned(['toy-car', 'rooms-living'])).toBe(false);
  });

  it('unlocks when game-console is owned', () => {
    expect(isConsoleOwned([CONSOLE_OWNED_ID])).toBe(true);
    expect(isConsoleOwned(['rug', CONSOLE_OWNED_ID])).toBe(true);
  });
});
