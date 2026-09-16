import { describe, expect, it } from 'vitest';

import { DEFAULT_ROOM, ROOM_IDS } from '../../model';

import { neighboursOf, roomIndex, stepRoom } from './neighbours';

// ═══════════════════════════════════════════
// 1. The map is the tuple
// ═══════════════════════════════════════════

describe('the map', () => {
  it('reads left to right in tuple order', () => {
    expect(ROOM_IDS).toEqual(['street', 'living', 'kitchen']);
  });

  it('opens on the pet’s room, not at an edge', () => {
    // Landing on an edge would hide half the map behind a single door.
    expect(roomIndex(DEFAULT_ROOM)).toBeGreaterThan(0);
    expect(roomIndex(DEFAULT_ROOM)).toBeLessThan(ROOM_IDS.length - 1);
  });

  it('places every room exactly once', () => {
    const indexes = ROOM_IDS.map(roomIndex);

    expect(new Set(indexes).size).toBe(ROOM_IDS.length);
  });
});

// ═══════════════════════════════════════════
// 2. Doors — a room only has one where a room is
// ═══════════════════════════════════════════

describe('neighboursOf', () => {
  it('gives the middle room a door on each side', () => {
    expect(neighboursOf('living')).toEqual({
      left: 'street',
      right: 'kitchen',
    });
  });

  it('leaves the far left without a left door', () => {
    expect(neighboursOf('street').left).toBeNull();
    expect(neighboursOf('street').right).toBe('living');
  });

  it('leaves the far right without a right door', () => {
    expect(neighboursOf('kitchen').right).toBeNull();
    expect(neighboursOf('kitchen').left).toBe('living');
  });

  it('never wraps around: the kitchen is not next to the street', () => {
    // Three rooms a child can learn, not a carousel they get lost in.
    expect(neighboursOf('kitchen').right).not.toBe('street');
    expect(neighboursOf('street').left).not.toBe('kitchen');
  });

  it('agrees with itself in both directions', () => {
    for (const room of ROOM_IDS) {
      const { left, right } = neighboursOf(room);

      if (left) expect(neighboursOf(left).right).toBe(room);
      if (right) expect(neighboursOf(right).left).toBe(room);
    }
  });
});

// ═══════════════════════════════════════════
// 3. Walking
// ═══════════════════════════════════════════

describe('stepRoom', () => {
  it('walks one room at a time', () => {
    expect(stepRoom('living', 'left')).toBe('street');
    expect(stepRoom('living', 'right')).toBe('kitchen');
  });

  it('stays put at the end of the map instead of throwing or wrapping', () => {
    expect(stepRoom('street', 'left')).toBe('street');
    expect(stepRoom('kitchen', 'right')).toBe('kitchen');
  });

  it('comes back where it started after a step and a step back', () => {
    for (const room of ROOM_IDS) {
      const { left, right } = neighboursOf(room);

      if (left) expect(stepRoom(stepRoom(room, 'left'), 'right')).toBe(room);
      if (right) expect(stepRoom(stepRoom(room, 'right'), 'left')).toBe(room);
    }
  });

  it('crosses the whole map in two steps either way', () => {
    expect(stepRoom(stepRoom('street', 'right'), 'right')).toBe('kitchen');
    expect(stepRoom(stepRoom('kitchen', 'left'), 'left')).toBe('street');
  });
});
