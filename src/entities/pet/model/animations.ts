// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** Layers an animation may move. Anything else is drawn, never animated. */
type AnimatedLayer = 'body' | 'head' | 'ears' | 'tail' | 'overlay';

/** The transform channels a track can drive. */
type Channel = 'translateX' | 'translateY' | 'rotate' | 'scale' | 'scaleY';

/**
 * One step: the value to reach and how long to take, in ms.
 *
 * A tuple rather than an object because a track is read as a shape — four
 * pairs on one line say "up, down, up, down" at a glance.
 */
type Keyframe = [value: number, durationMs: number];

/** One channel of one layer over time. */
interface Track {
  layer: AnimatedLayer;
  channel: Channel;
  /** At least one step. The player reads the last one to close a loop. */
  keyframes: Keyframe[];
}

/** One animation of the catalogue. */
interface PetAnimation {
  id: string;
  title: string;
  /** Repeats forever. A one-shot plays once and stays where it ended. */
  loop: boolean;
  /** Whether the eyes blink while it plays. Off for closed-eye faces. */
  blink: boolean;
  /** Everything it moves. Layers not listed ease back to rest. */
  tracks: Track[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The neutral value of every channel.
 *
 * A pet at rest is not a pet at zero: scales rest at 1. The player uses this
 * both to close a loop and to release a layer the new animation does not touch.
 */
const REST: Record<Channel, number> = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  scale: 1,
  scaleY: 1,
};

/**
 * The animation catalogue.
 *
 * Every entry is idle-sized on purpose: the pet is on screen the whole time a
 * child is in the app, and a big motion repeated forever stops reading as alive
 * and starts reading as a banner. Nothing here is an alarm — worry is expressed
 * by the face and the pet's line, never by shaking the screen (3.5).
 */
const ANIMATIONS = {
  breathe: {
    id: 'breathe',
    title: 'Дышит',
    loop: true,
    blink: true,
    tracks: [{ layer: 'body', channel: 'scale', keyframes: [[1.025, 1700]] }],
  },
  hop: {
    id: 'hop',
    title: 'Подпрыгивает',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'body',
        channel: 'translateY',
        keyframes: [
          [-14, 260],
          [0, 220],
          [0, 900],
        ],
      },
      { layer: 'ears', channel: 'rotate', keyframes: [[-5, 260]] },
    ],
  },
  tilt: {
    id: 'tilt',
    title: 'Наклоняет голову',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'head',
        channel: 'rotate',
        keyframes: [
          [7, 700],
          [7, 900],
        ],
      },
    ],
  },
  sway: {
    id: 'sway',
    title: 'Покачивается',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'body',
        channel: 'rotate',
        keyframes: [
          [3, 1000],
          [-3, 2000],
        ],
      },
    ],
  },
  sleep: {
    id: 'sleep',
    title: 'Спит',
    loop: true,
    // The eyes are already closed by the face — blinking them would twitch.
    blink: false,
    tracks: [
      { layer: 'body', channel: 'scale', keyframes: [[1.035, 2400]] },
      { layer: 'overlay', channel: 'translateY', keyframes: [[-10, 2400]] },
    ],
  },
  sniff: {
    id: 'sniff',
    title: 'Принюхивается',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'head',
        channel: 'translateY',
        keyframes: [
          [4, 240],
          [0, 240],
          [4, 240],
          [0, 1400],
        ],
      },
    ],
  },
  shiver: {
    id: 'shiver',
    title: 'Дрожит',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'body',
        channel: 'translateX',
        keyframes: [
          [2.5, 90],
          [-2.5, 90],
          [2.5, 90],
          [-2.5, 90],
          [0, 900],
        ],
      },
    ],
  },
  droop: {
    id: 'droop',
    title: 'Поник',
    loop: true,
    blink: true,
    tracks: [
      { layer: 'head', channel: 'translateY', keyframes: [[5, 1600]] },
      { layer: 'ears', channel: 'rotate', keyframes: [[-7, 1600]] },
    ],
  },
  shake: {
    id: 'shake',
    title: 'Отряхивается',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'body',
        channel: 'rotate',
        keyframes: [
          [6, 110],
          [-6, 110],
          [6, 110],
          [0, 1500],
        ],
      },
      {
        layer: 'ears',
        channel: 'rotate',
        keyframes: [
          [-12, 110],
          [12, 110],
          [0, 1600],
        ],
      },
    ],
  },
  bounce: {
    id: 'bounce',
    title: 'Скачет',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'body',
        channel: 'translateY',
        keyframes: [
          [-20, 220],
          [0, 200],
          [-10, 180],
          [0, 600],
        ],
      },
    ],
  },
  wiggle: {
    id: 'wiggle',
    title: 'Виляет',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'tail',
        channel: 'rotate',
        keyframes: [
          [14, 240],
          [-14, 240],
        ],
      },
      { layer: 'body', channel: 'rotate', keyframes: [[2, 480]] },
    ],
  },
  jump: {
    id: 'jump',
    title: 'Подскочил',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'body',
        channel: 'translateY',
        keyframes: [
          [-26, 180],
          [0, 260],
          [0, 1600],
        ],
      },
      { layer: 'ears', channel: 'rotate', keyframes: [[-9, 180]] },
    ],
  },
  puff: {
    id: 'puff',
    title: 'Приосанился',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'body',
        channel: 'scale',
        keyframes: [
          [1.06, 700],
          [1.06, 900],
        ],
      },
      { layer: 'head', channel: 'translateY', keyframes: [[-4, 700]] },
    ],
  },
  chew: {
    id: 'chew',
    title: 'Жуёт',
    loop: true,
    blink: true,
    tracks: [
      {
        layer: 'head',
        channel: 'scaleY',
        keyframes: [
          [0.94, 180],
          [1, 180],
          [0.94, 180],
          [1, 700],
        ],
      },
    ],
  },
} satisfies Record<string, PetAnimation>;

type AnimationKey = keyof typeof ANIMATIONS;

const ANIMATION_KEYS = Object.keys(ANIMATIONS) as AnimationKey[];

// ═══════════════════════════════════════════
// LIB
// ═══════════════════════════════════════════

export const getAnimation = (key: AnimationKey): PetAnimation =>
  ANIMATIONS[key];

export type {
  AnimatedLayer,
  AnimationKey,
  Channel,
  Keyframe,
  PetAnimation,
  Track,
};
export { ANIMATION_KEYS, ANIMATIONS, REST };
