// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Overseer (strict, right) and Keeper (kind, left). */
const WATCHER_IDS = ['overseer', 'keeper'] as const;

/** Shared action vocabulary; clip names per model live in `WATCHER_CLIPS`. */
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

const DEFAULT_WATCHER_ACTION = 'idle';

/**
 * Arena units per metre. Overseer reads a notch larger on the map — matches the
 * layout concept (right block bigger than the left).
 */
const WATCHER_SCALE = {
  overseer: 120,
  keeper: 95,
} as const;

/**
 * Overhead map placement (X right, Y up, Z toward camera). Both sit behind the
 * pit so they watch the dog from the far side — keeper left, overseer right.
 */
const WATCHER_PLACEMENT = {
  overseer: { x: 360, y: 125, z: -300 },
  keeper: { x: -360, y: 125, z: -300 },
} as const;

/** Ceiling / FX meshes shipped with the GLBs — larger than the arena if left in. */
const WATCHER_HIDDEN_MATERIALS = ['Ceiling', 'FX_Field', 'FX_FloorGlow'];

/** Aim point on the dog (chest height in arena units). */
const WATCHER_DOG_AIM_Y = 40;

/**
 * How far to turn from facing the map toward the dog, `0…1`.
 * From behind the pit, pure face-on still reads as "at the camera"; a clear
 * inward glance needs a real fraction of the look-at yaw.
 */
const WATCHER_AIM_BLEND = 0.55;

/** Soft yaw / pitch so screens glance at the dog without spinning hard. */
const aimAtDog = (spot: {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}) => {
  const dx = -spot.x;
  const dy = WATCHER_DOG_AIM_Y - spot.y;
  const dz = -spot.z;

  return {
    yaw: ((Math.atan2(dx, dz) * 180) / Math.PI) * WATCHER_AIM_BLEND,
    pitch:
      ((Math.atan2(-dy, Math.hypot(dx, dz)) * 180) / Math.PI) *
      WATCHER_AIM_BLEND,
  };
};

const overseerAim = aimAtDog(WATCHER_PLACEMENT.overseer);
const keeperAim = aimAtDog(WATCHER_PLACEMENT.keeper);

const WATCHER_YAW = {
  overseer: overseerAim.yaw,
  keeper: keeperAim.yaw,
} as const;

const WATCHER_PITCH = {
  overseer: overseerAim.pitch,
  keeper: keeperAim.pitch,
} as const;

/** Camera stand-off when focused — face stays above the React terminal (~40%). */
const WATCHER_FOCUS_DISTANCE = 520;

/** Rise while focused so the face clears the arena rim above the terminal. */
const WATCHER_FOCUS_LIFT = 140;

/** Aim slightly under the face so it lands in the upper third of the frame. */
const WATCHER_FOCUS_AIM_DOWN = 28;

const WATCHER_FOCUS_ACTION = 'talk';

/** Crossfade between clips — never a hard cut. */
const WATCHER_FADE_SEC = 0.4;

/**
 * How much of each clip's rock reaches the model. The shipped idles sway hard;
 * keep a light weight so they still glance without lurching.
 */
const WATCHER_CLIP_WEIGHT = 0.18;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type WatcherId = (typeof WATCHER_IDS)[number];

type WatcherAction = (typeof WATCHER_ACTIONS)[number];

export type { WatcherAction, WatcherId };
export {
  DEFAULT_WATCHER_ACTION,
  WATCHER_ACTIONS,
  WATCHER_CLIP_WEIGHT,
  WATCHER_CLIPS,
  WATCHER_FADE_SEC,
  WATCHER_FOCUS_ACTION,
  WATCHER_FOCUS_AIM_DOWN,
  WATCHER_FOCUS_DISTANCE,
  WATCHER_FOCUS_LIFT,
  WATCHER_HIDDEN_MATERIALS,
  WATCHER_IDS,
  WATCHER_PITCH,
  WATCHER_PLACEMENT,
  WATCHER_SCALE,
  WATCHER_YAW,
};
