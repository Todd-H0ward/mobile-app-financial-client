import { compose, fillCanvas, pitWall, type Rows } from '../../lib/compose';
import { SPRITES } from '../sprites';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Puzzle boards are square, so every scene is too. */
const SIDE = 48;

/** Floor line: the dog's feet land a few rows below it. */
const HORIZON = 30;

/** Top of the dog so that its paws stand on the floor. */
const DOG_Y = 22;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const wall = (
  wallInk: string,
  mortar: string,
  floor: string,
  floorShade: string,
): Rows =>
  pitWall({
    width: SIDE,
    height: SIDE,
    horizon: HORIZON,
    wall: wallInk,
    mortar,
    floor,
    floorShade,
  });

/** A night sky with a fixed scatter of stars — the view up out of the pit. */
const sky = (height: number): Rows =>
  fillCanvas(SIDE, height, 'n').map((row, y) =>
    [...row]
      .map((ink, x) => ((x * 5 + y * 11) % 23 === 0 ? 'Y' : ink))
      .join(''),
  );

/** A flat oval of water for the duck to sit in. */
const PUDDLE: Rows = [
  '....kkkkkkkkkkkk....',
  '..kkBBBBBBBBBBBBkk..',
  '.kBwwBBBBBBBBBBBBbk.',
  '.kbBBBBBBBBBBBBBBbk.',
  '..kkbbbbbbbbbbbbkk..',
  '....kkkkkkkkkkkk....',
];

/** A string the yo-yo hangs from, top of the scene down. */
const STRING: Rows = Array.from({ length: 14 }, () => 'm');

/** Two speed lines behind something flying or rolling. */
const WHOOSH: Rows = ['www..', '.....', '..www', '.....', 'www..'];

// ═══════════════════════════════════════════
// SCENES
// ═══════════════════════════════════════════

/**
 * The puzzle pictures, 48×48. Each is a toy's moment with the dog in the pit,
 * put together from the sheet so it always matches the rest of the art.
 */
export const PUZZLE_SCENES = {
  arena: compose(wall('l', 'm', 'm', 'd'), [
    { sprite: SPRITES.gear, x: 2, y: 3 },
    { sprite: SPRITES.gear, x: 33, y: 4 },
    { sprite: SPRITES.stairs, x: 31, y: 24 },
    { sprite: SPRITES.dogSide, x: 6, y: DOG_Y },
    { sprite: SPRITES.coin, x: 18, y: 5 },
  ]),
  ball: compose(wall('u', 'U', 'C', 'U'), [
    { sprite: SPRITES.dogSide, x: 2, y: DOG_Y },
    { sprite: WHOOSH, x: 26, y: 33 },
    { sprite: SPRITES.toyBall, x: 31, y: 27 },
  ]),
  bone: compose(wall('t', 'T', 'm', 'd'), [
    { sprite: SPRITES.dogSide, x: 21, y: DOG_Y, isMirrored: true },
    { sprite: SPRITES.toyBone, x: 2, y: 30 },
    { sprite: SPRITES.gear, x: 4, y: 6 },
  ]),
  frisbee: compose(
    compose(wall('b', 'n', 'm', 'd'), [{ sprite: sky(12), x: 0, y: 0 }]),
    [
      { sprite: WHOOSH, x: 22, y: 8 },
      { sprite: SPRITES.toyFrisbee, x: 28, y: 1 },
      { sprite: SPRITES.dogSide, x: 8, y: DOG_Y - 4 },
    ],
  ),
  duck: compose(wall('l', 'm', 'm', 'd'), [
    { sprite: PUDDLE, x: 26, y: 38 },
    { sprite: SPRITES.toyDuck, x: 28, y: 27 },
    { sprite: SPRITES.dogSide, x: 1, y: DOG_Y },
  ]),
  yoyo: compose(wall('c', 'C', 'm', 'd'), [
    { sprite: STRING, x: 38, y: 0 },
    { sprite: SPRITES.toyYoyo, x: 31, y: 10 },
    { sprite: SPRITES.dogSide, x: 4, y: DOG_Y },
  ]),
  cube: compose(wall('g', 'h', 'm', 'd'), [
    { sprite: SPRITES.toyCube, x: 30, y: 29 },
    { sprite: SPRITES.toyCube, x: 30, y: 20 },
    { sprite: SPRITES.toyCube, x: 30, y: 11 },
    { sprite: SPRITES.dogSide, x: 3, y: DOG_Y },
  ]),
} as const satisfies Record<string, Rows>;

type SceneName = keyof typeof PUZZLE_SCENES;

/** Content names a scene as a plain string; this is how it is checked. */
export const isSceneName = (value: unknown): value is SceneName =>
  typeof value === 'string' && Object.hasOwn(PUZZLE_SCENES, value);

export type { SceneName };
