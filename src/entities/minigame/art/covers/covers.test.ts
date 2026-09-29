import { describe, expect, it } from 'vitest';

import { isSpriteName } from '@/entities/sprite';

import { PLAYKIT_GAME_IDS } from '../../lib/payout';

import { GAME_COVER_SPRITES } from './covers';

describe('GAME_COVER_SPRITES', () => {
  it('gives every Overseer trial a cover from the sheet', () => {
    for (const gameId of PLAYKIT_GAME_IDS) {
      expect(isSpriteName(GAME_COVER_SPRITES[gameId])).toBe(true);
    }
  });
});
