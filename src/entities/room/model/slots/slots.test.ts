import { describe, expect, it } from 'vitest';

import { ROOM_IDS } from '../rooms';

import { listFurnitureSlots, ownedSlotsInRoom } from './slots';

describe('furniture slots', () => {
  it('places every slot in a known room', () => {
    for (const slot of listFurnitureSlots()) {
      expect(ROOM_IDS).toContain(slot.roomId);
      expect(slot.left).toBeGreaterThanOrEqual(0);
      expect(slot.top).toBeGreaterThanOrEqual(0);
      expect(slot.width).toBeGreaterThan(0);
      expect(slot.height).toBeGreaterThan(0);
    }
  });

  it('keeps furniture ids unique — one place per buy', () => {
    const ids = listFurnitureSlots().map((slot) => slot.furnitureId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns only owned slots for a room', () => {
    expect(ownedSlotsInRoom('living', [])).toEqual([]);
    expect(ownedSlotsInRoom('kitchen', ['rug', 'lamp'])).toEqual([]);

    const living = ownedSlotsInRoom('living', ['rug', 'lamp', 'nope']);
    expect(living.map((slot) => slot.furnitureId).sort()).toEqual([
      'lamp',
      'rug',
    ]);
  });
});
