import { describe, expect, it } from 'vitest';

import { compose, fillCanvas, mirror, pitWall } from './compose';

describe('compose', () => {
  it('pastes a sprite and lets its `.` show the canvas', () => {
    const scene = compose(fillCanvas(3, 2, 'a'), [
      { sprite: ['b.', '.b'], x: 1, y: 0 },
    ]);
    expect(scene).toEqual(['aba', 'aab']);
  });

  it('drops what falls off the canvas instead of wrapping it', () => {
    const scene = compose(fillCanvas(2, 2, 'a'), [
      { sprite: ['bbb', 'bbb', 'bbb'], x: -1, y: 1 },
    ]);
    expect(scene).toEqual(['aa', 'bb']);
  });

  it('lets a later stamp cover an earlier one', () => {
    const scene = compose(fillCanvas(1, 1, 'a'), [
      { sprite: ['b'], x: 0, y: 0 },
      { sprite: ['c'], x: 0, y: 0 },
    ]);
    expect(scene).toEqual(['c']);
  });

  it('mirrors a stamp on request', () => {
    const scene = compose(fillCanvas(2, 1, 'a'), [
      { sprite: ['b.'], x: 0, y: 0, isMirrored: true },
    ]);
    expect(scene).toEqual(['ab']);
  });
});

describe('mirror', () => {
  it('reverses every row', () => {
    expect(mirror(['ab', 'cd'])).toEqual(['ba', 'dc']);
  });
});

describe('pitWall', () => {
  const wall = pitWall({
    width: 24,
    height: 20,
    horizon: 12,
    wall: 'w',
    mortar: 'm',
    floor: 'f',
    floorShade: 's',
  });

  it('is exactly the size asked for', () => {
    expect(wall).toHaveLength(20);
    for (const row of wall) expect(row).toHaveLength(24);
  });

  it('draws the floor line at the horizon and only floor below it', () => {
    expect(wall[12]).toBe('s'.repeat(24));
    for (const row of wall.slice(13)) expect(row).toMatch(/^[fs]+$/);
  });

  it('staggers the seams of neighbouring courses', () => {
    const seams = (row: string) =>
      [...row].flatMap((ink, x) => (ink === 'm' ? [x] : []));
    expect(seams(wall[0] ?? '')).not.toEqual(seams(wall[6] ?? ''));
  });
});
