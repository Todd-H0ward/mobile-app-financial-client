// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The two screens watching the arena.
 *
 * `overseer` is the strict one — a levitating set that hovers and scans.
 * `keeper` is the kind one, hung off a ceiling bracket. The game will play
 * them against each other; the scene only has to hang them up.
 */
const WATCHER_IDS = ['overseer', 'keeper'] as const;

/**
 * What a screen can be doing.
 *
 * Four states each, and the two models name them differently — the strict one
 * scans and rages where the kind one sleeps and cheers. The vocabulary here is
 * the game's; `WATCHER_CLIPS` is where it meets the artist's.
 */
const WATCHER_ACTIONS = ['idle', 'talk', 'react', 'rest'] as const;

/** Clip names inside each GLB, exactly as exported. */
const WATCHER_CLIPS = {
  overseer: {
    idle: 'Watch_Nablyudenie',
    talk: 'Talk_Rech',
    react: 'Anger_Gnev',
    rest: 'Scan_Skanirovanie',
  },
  keeper: {
    idle: 'Idle_Pokoy',
    talk: 'Talk_Rech',
    react: 'Joy_Radost',
    rest: 'Sleep_Son',
  },
} as const;

/** What plays when the game has nothing to say. */
const DEFAULT_WATCHER_ACTION = 'idle';

/**
 * Arena units per metre.
 *
 * Both models are built to scale — one unit is one metre — while the arena is
 * in the units the house was modelled in. The pet is the yardstick: a robot
 * dog stands 95 units tall here and about seventy centimetres tall in life.
 *
 * True scale would be 85, but the keeper is 4.9 metres across its mount and
 * the frame only 800 units wide: at 85 it hangs a hundred units past the edge
 * of the screen. The frame wins — a watcher that is cropped is not watching.
 */
const WATCHER_UNITS_PER_METRE = 58;

/**
 * Where each screen hangs, in arena units, over the far side of the pit.
 *
 * Read in the overhead view's frame, which the rig is aligned to: X is
 * sideways, Y up, Z towards the camera. The strict one takes the right, the
 * kind one the left, and both hang high enough to be above the rim rather
 * than in front of it.
 *
 * They are pushed out towards the corners as far as the frame allows and no
 * further, which is why the two numbers differ. The camera sits some 2 200
 * units back through a 45° lens on a portrait screen, leaving barely 400
 * units of half-width; the overseer is a small set and clears it easily at
 * 250, while the keeper is 2.8 metres across its casing and sits flush
 * against the edge there. Symmetry would cost the keeper an ear, and a
 * watcher with its face off the screen is not watching.
 */
const WATCHER_PLACEMENT = {
  overseer: { x: 250, y: 500, z: 260 },
  keeper: { x: -222, y: 500, z: 260 },
} as const;

/**
 * Parts of the delivered models the scene does not use.
 *
 * The keeper ships with the slab of ceiling it is bolted to and the overseer
 * with its levitation haze — both documented as removable, and both far
 * bigger than the machines themselves. Left in, the ceiling alone is taller
 * than the arena is wide.
 */
const WATCHER_HIDDEN_MATERIALS = ['Ceiling', 'FX_Field', 'FX_FloorGlow'];

/**
 * How far each one is turned on its own axis, in degrees.
 *
 * They hang in the world now instead of riding the camera, so they need a
 * pose rather than a permanent stare: both are angled in towards the middle
 * of the arena, which is where the pet is and where the child is looking.
 * Turned, not spun — the faces have to stay readable from the top view.
 */
const WATCHER_YAW = {
  /** On the right of the frame, so it looks left, towards the centre. */
  overseer: -18,
  /** On the left, looking right. */
  keeper: 18,
} as const;

/**
 * How far in front of a screen the camera sits when the child taps it.
 *
 * Close enough to read: the machine answers on its own display, so the shot
 * has to be the display, filling the frame the way a terminal does — not the
 * machine standing in a room. The panels are 82 units across, and a 45° lens
 * on a portrait screen sees about 100 units of width from here, so the screen
 * takes four fifths of it and the casing makes up the border.
 */
const WATCHER_FOCUS_DISTANCE = 260;

/** What a watcher plays while the child is standing in front of it. */
const WATCHER_FOCUS_ACTION = 'talk';

/** Seconds one clip takes to blend into the next. Never a hard cut. */
const WATCHER_FADE_SEC = 0.4;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type WatcherId = (typeof WATCHER_IDS)[number];

type WatcherAction = (typeof WATCHER_ACTIONS)[number];

export type { WatcherAction, WatcherId };
export {
  DEFAULT_WATCHER_ACTION,
  WATCHER_ACTIONS,
  WATCHER_CLIPS,
  WATCHER_FADE_SEC,
  WATCHER_FOCUS_ACTION,
  WATCHER_FOCUS_DISTANCE,
  WATCHER_HIDDEN_MATERIALS,
  WATCHER_IDS,
  WATCHER_PLACEMENT,
  WATCHER_UNITS_PER_METRE,
  WATCHER_YAW,
};
